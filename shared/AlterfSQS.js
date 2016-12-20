'use strict'

var AWS = require('aws-sdk');

var AlterfSQS = function() {
    var config = null;
    var sqs = null;
    var commandQueueUrl = null;
    var outputQueueUrl = null;

    this.config = function(c) {
        if (c) {
            config = c;
            AWS.config.update({accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey, region: c.region});
            sqs = new AWS.SQS();
        }
        return config;
    }

    this.connect = function() {
        let commandParams = {
            QueueName: config.commandQueue,
            QueueOwnerAWSAccountId: config.queueOwnerId
        };
        let outputParams = {
            QueueName: config.outputQueue,
            QueueOwnerAWSAccountId: config.queueOwnerId
        };
        return sqs.getQueueUrl(commandParams).promise().then(function(data) {
            commandQueueUrl = data.QueueUrl;
            console.log("SQS.connect: Found command queue '" + config.commandQueue + "' at " + commandQueueUrl);
            return sqs.getQueueUrl(outputParams).promise();
        }).then(function(data) {
            outputQueueUrl = data.QueueUrl;
            console.log("SQS.connect: Found output queue '" + config.outputQueue + "' at " + outputQueueUrl);
        }).catch(function(err) {
            console.error("SQS.connect error: " + err);
        });
    }

    this.length = function() {
        let commandParams = {
            QueueUrl: commandQueueUrl,
            AttributeNames: [ 'ApproximateNumberOfMessages' ]
        }
        let outputParams = {
            QueueUrl: outputQueueUrl,
            AttributeNames: [ 'ApproximateNumberOfMessages' ]
        }
        var result = {
            "output": 0,
            "command": 0
        };
        return sqs.getQueueAttributes(commandParams).promise().then(function(data) {
            console.log("SQS.length: commandQueue: " + data.Attributes.ApproximateNumberOfMessages);
            result.command = data.Attributes.ApproximateNumberOfMessages;
            return sqs.getQueueAttributes(outputParams).promise();
        }).then(function(data) {
            console.log("SQS.length: outputQueue: " + data.Attributes.ApproximateNumberOfMessages);
            result.output = data.Attributes.ApproximateNumberOfMessages;
            return new Promise(function(resolve) {
                resolve(result);
            });
        }).catch(function(err) {
            console.error("SQS.length error: " + err);
            return new Promise(function(resolve, reject) { reject(err); });
        });
    }

    this.clear = function() {
        let commandParams = {
            QueueUrl: commandQueueUrl
        }
        let outputParams = {
            QueueUrl: outputQueueUrl
        }

        return sqs.purgeQueue(commandParams).promise().then(function() {
            console.log("SQS.clear: " + commandParams.QueueUrl + " cleared");
            return sqs.purgeQueue(outputParams).promise();
        }).then(function() {
            console.log("SQS.clear: " + outputParams.QueueUrl + " cleared");
            return new Promise(function(resolve) { resolve(); });
        }).catch(function(err) {
            console.console.error("SQS.clear error: " + err);
            return new Promise(function(resolve, reject) { reject(err); });
        });
    }

    this.isConnected = function() {
        return commandQueueUrl != null;
    }

    this.deleteMessages = function(queueUrl, messages) {
        var deleteParams = {
            QueueUrl: queueUrl,
            Entries: []
        };
        for (var m of messages) {
            deleteParams.Entries.push({
                Id: m.MessageId,
                ReceiptHandle: m.ReceiptHandle,
            });
        }
        if (deleteParams.Entries.length > 0) {
            sqs.deleteMessageBatch(deleteParams, function(err, data) {
                if (err) {
                    console.error("SQS.deleteMessages(" + queueUrl + "): delete error: " + err);
                } else {
                    console.log("SQS.deleteMessages(" + queueUrl + "): deleted messages: " + JSON.stringify(data));
                }
            });
        }
    }

    this.listen = function(queueUrl, handler) {
        var params = {
            QueueUrl: queueUrl,
            MaxNumberOfMessages: 10,
            AttributeNames: [
                'SentTimestamp'
            ],
            VisibilityTimeout: 30,
            WaitTimeSeconds: 20
        };

        var that = this;

        console.log("SQS.listen(" + queueUrl + "): listening...");

        (function poll() {
            sqs.receiveMessage(params, function(err, data) {
                if (err) {
                    console.error("SQS.listen(" + queueUrl + "): Error: " + err);

                    handler(err, null);
                } else {
                    console.log("SQS.listen(" + queueUrl + "): received data: " + JSON.stringify(data));

                    that.deleteMessages(queueUrl, data.Messages);

                    var messages = data.Messages.map(function(m) {
                        return {
                            id: m.MessageId,
                            timestamp: m.Attributes.SentTimestamp,
                            body: JSON.parse(m.Body)
                        };
                    });
                    messages.sort(function(a, b) {
                        return a.timestamp - b.timestamp;
                    });
                    handler(null, messages);
                }
                setTimeout(poll(), 0);
            });
        })();
    }

    this.listenForCommands = function(handler) {
        return this.listen(commandQueueUrl, handler);
    }

    this.listenForOutput = function(handler) {
        return this.listen(outputQueueUrl, handler);
    }

    this.sendCommand = function(command, params) {
        return this.send(commandQueueUrl, JSON.stringify({
            command: command,
            parameters: params
        }));
    }

    this.sendOutput = function(command, output) {
        return this.send(outputQueueUrl, JSON.stringify({
            command: command,
            output: output
        }));
    }

    this.send = function(queueUrl, body) {
        var params = {
            QueueUrl: queueUrl,
            MessageBody: body
        };
        return sqs.sendMessage(params).promise().then(function(data) {
            console.log("SQS.send(" + queueUrl + "): sent: " + JSON.stringify(data));
            return new Promise(function(resolve) {
                resolve();
            });
        }).catch(function(err) {
            console.log("SQS.send(" + queueUrl + "): Error: " + err);
            return new Promise(function(resolve, err) {
                reject(err);
            });
        });
    }
}

module.exports = AlterfSQS;
