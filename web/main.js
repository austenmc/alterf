var Alterf = require("../shared/Alterf.js");
var CommandHandler = require("../shared/CommandHandler.js");
var AlterfSQS = require("../shared/AlterfSQS.js");
var $ = require('jquery');

$(document).ready(function() {
    var version = "<strong>Alterf</strong> v0.1.20160922 🔭🦁";
    var sqs = null;
    var commandPrompt = null;
    var prompt = '🦁<div class="spacer"></div><strong>&gt;</strong><div class="spacer"></div>';
    var remotePrompt = '🔭<div class="spacer"></div><strong>&gt;</strong><div class="spacer"></div>';

    let output = function(text) {
        $("#output").append("<li>" + text + "</li>");
    }

    let connect = function(params, out) {
        out("Connecting...");
        if (sqs == null) {
            sqs = new AlterfSQS();
        }
        sqs.config(params);
        return sqs.connect().then(function() {
            out("&nbsp;&nbsp;Successfully connected 🎉")

            sqs.listenForOutput(function (err, messages) {
                if (err) {
                    output(remotePrompt + ": error listening for output: " + err);
                } else {
                    for (let m of messages) {
                        for (let o of m.body.output) {
                            output(remotePrompt + m.body.command + ": " + o);
                        }
                    }
                }
            });
        }).catch(function(err) {
            out("&nbsp;&nbsp;Encountered an error: " + err);
        });
    }

    output(version);
    output("Try '<strong>help</strong>' for list of commands.");
    output("&nbsp;");

    var config = JSON.parse(localStorage.getItem(Alterf.ConfigStorageKey));
    if (config) {
        output("Loading local configuration:");
        Object.keys(config).forEach(function(key, index) {
            output("&nbsp;&nbsp;" + key + ": " + (key == "secretAccessKey" ? "&lt;hidden&gt;" : this[key]));
        }, config);
        output("&nbsp;");

        connect(config, output).then(function() {
            output("&nbsp;");
        })
    } else {
        output("No stored config found. Use <strong>queue-config</strong> command to set parameters.");
        output("&nbsp;");
    }

    commandPrompt = new CommandHandler({
        "print": output
    });

    commandPrompt.registerCommand({
        "name": "help",
        "handler": function(h) {
            h.print(version);
            h.print("Send commands to a remote device running the Alterf app.");
            h.print("Alterf means, 'The view of the Lion', and is the Arabic name for a star in the constellation Leo.");
            h.print("&nbsp;");
            var table = "<table><tbody>";
            for (var c of commandPrompt.commands) {
                table += "<tr>";
                table += "<td class='command top-level'>" + c.name + "</td>";
                table += "<td>" + c.help + "</td>";
                table += "</tr>";
                if (c.parameters) {
                    table += "<tr>";
                    table += "<td></td>";
                    table += "<td><table><tbody>";
                    for (var p in c.parameters) {
                        table += "<tr>";
                        table += "<td class='command'>" + p + "</td>";
                        table += "<td>" + c.parameters[p] + "</td>";
                        table += "</tr>";
                    }
                    table += "</td></tbody></table>";
                    table += "</tr>";
                }
            }
            table += "</tbody></table>";
            h.print(table);
        },
        "help": "Print list of commands"
    });

    commandPrompt.registerCommand({
        "name": "queue-config",
        "handler": function(h, params) {
            connect(params, h.print).then(function() {
                h.print("Storing config locally");
                localStorage.setItem(Alterf.ConfigStorageKey, JSON.stringify(params));
            }).catch(function() {
                h.print("Aborting configuration");
            });
        },
        "parameters": {
            "commandQueue": "Name of the Amazon SQS queue to use as command queue",
            "outputQueue": "Name of the Amazon SQS queue to use as output queue, from the remove device",
            "region": "Amazon region to connect to, probably us-east-1",
            "queueOwnerId": "Numerical ID of the AWS user who created the queue",
            "accessKeyId": "AWS access key",
            "secretAccessKey": "AWS access secret"
        },
        "help": "Set configuration parameters:"
    });

    commandPrompt.registerCommand({
        "name": "queue-length",
        "handler": function(h) {
            if (sqs.isConnected()) {
                sqs.length().then(function(data) {
                    h.print("Command Queue (approx) length: " + data.command);
                    h.print("Output Queue (approx) length: " + data.output);
                }).catch(function(err) {
                    h.print("Error: " + err);
                });
            } else {
                h.print("Error: not connected to the queues, try <strong>queue-config</strong>.")
            }
        },
        "help": "Show approximate number of pending commands and output"
    });

    commandPrompt.registerCommand({
        "name": "queue-clear",
        "handler": function(h) {
            if (sqs.isConnected()) {
                sqs.clear().then(function() {
                    h.print("Queue '" + sqs.config().commandQueue + "' cleared");
                    h.print("Queue '" + sqs.config().outputQueue + "' cleared");
                }).catch(function(err) {
                    h.print("Error: " + err);
                });
            } else {
                h.print("Error: not connected to the queues, try <strong>queue-config</strong>.")
            }
        },
        "help": "Remove all pending commands and output from the queues"
    });

    commandPrompt.registerCommand({
        "name": "test-output",
        "handler": function(h) {
            if (sqs.isConnected()) {
                sqs.sendOutput("test-output", ["Testing, Testing", "1..2..3"]);
                sqs.sendOutput("test-output", ["Turn me up in the 🎧"]);
            } else {
                h.print("Error: not connected to the queues, try <strong>queue-config</strong>.")
            }
        },
        "help": "Sends some test output to the output queue"
    });

    $("#cli").focus();

    $("#cli").keyup(function(e) {
        if (e.keyCode == 13) {
            var line = $("#cli").val().trim();
            if (line != "") {
                output("<span class='echo'>" + prompt + line + "</span>");
                commandPrompt.handle($("#cli").val());
                $("#cli").val("");
                $('html, body').animate(
                    { scrollTop: $(document).height() },
                    150,
                    "linear"
                );
            }
            return false;
        }
    });
});
