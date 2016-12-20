'use strict'

var CommandHandler = function(h) {
    this.commands = [];

    var config = null;

    this.registerCommand = function(command) {
        this.commands.push(command);
    }

    this.handle = function(line) {
        line = line.trim();
        let parts = line.split(" ");

        let name = parts[0];
        for (var cmd of this.commands) {
            if (cmd.name == name) {
                // Process arguments.
                var params = {};
                if (cmd.parameters) {
                    for (var i = 1; i < parts.length; i++) {
                        let p = parts[i];
                        let paramParts = p.split("=");
                        if (cmd.parameters[paramParts[0]] == null) {
                            h.print(name + ": unknown parameter '" + paramParts[0] + "'");
                            return false;
                        }
                        params[paramParts[0]] = paramParts[1];
                    }
                    if (Object.keys(params).length != Object.keys(cmd.parameters).length) {
                        h.print(name + ": invalid number of parameters");
                        return false;
                    }
                }

                cmd.handler(h, params);

                return true;
            }
        }

        h.print(name + ": unknown command, try 'help'");
        return false;
    }
}

module.exports = CommandHandler;
