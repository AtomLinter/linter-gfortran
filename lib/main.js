'use babel'

import {
    CompositeDisposable
}
from 'atom'

module.exports = {
    config: {
        execPath: {
            title: "gfortran Executable Path",
            description: "Path to the gfortran binary",
            type: "string",
            default: "gfortran"
        },
        gfortranDefaultFlags: {
            title: "Fortran flags",
            description: "Flags for Fortran linting",
            type: "string",
            default: "-fsyntax-only -Wall -Wextra"
        },
        gfortranLintOnTheFly: {
            title: "Lint files on-the-fly",
            description: "Please ensure any auto-saving packages are disabled before using this feature",
            type: "boolean",
            default: false
        },
    },

    messages: {},
    linter_gfortran: undefined,
    temp_file : require("tempfile")(".f90"),

    lint: function(editor, linted_file, real_file){
        const helpers=require("atom-linter");
        const regex = "(.+):(?<line>\\d+):(?<col>\\d+):((.|\\n)*)(?<type>(Error|Warning|Note)):\\s*(?<message>.*)"
        command = require("./utility").buildCommand(editor, linted_file);
        return helpers.exec(command.binary, command.args, {stream: "stderr"}).then(output => {
            msgs = helpers.parse(output, regex)
            msgs.forEach(function(entry){
                entry.filePath = real_file;
            })
            module.exports.messages[real_file] = msgs;
            if (typeof module.exports.linter_gfortran != "undefined"){
                module.exports.linter_gfortran.setMessages(require("./utility").flattenHash(module.exports.messages))
            }
            return msgs;
        })
    },

    activate: function() {
        this.subscriptions = new CompositeDisposable()
    },
    deactivate: function() {
        this.subscriptions.dispose()
    },
    consumeLinter: function(indieRegistry) {
        module.exports.linter_gfortran = indieRegistry.register({
            name: 'gfortran'
        })

        subs = this.subscriptions;
        utility = require("./utility")
        lintOnTheFly = function() {
            editor = utility.getValidEditor(atom.workspace.getActiveTextEditor());
            if (!editor) return;
            if (atom.config.get("linter-gfortran.gfortranLintOnTheFly") == false) return;
            require('fs-extra').outputFileSync(module.exports.temp_file, editor.getText());
            module.exports.lint(editor, module.exports.temp_file, editor.getPath());
        };

        lintOnSave = function(){
            editor = utility.getValidEditor(atom.workspace.getActiveTextEditor());
            if (!editor) return;
            if (atom.config.get("linter-gfortran.gfortranLintOnTheFly") == true) return;
            real_file = editor.getPath();
            module.exports.lint(editor, real_file, real_file);
        };

        cleanupMessages = function(){
            editor_hash = {};
            module.exports.linter_gfortran.setMessages( require("./utility").flattenHash(module.exports.messages) );
        };

        subs.add(module.exports.linter_gfortran)

        atom.workspace.observeTextEditors(function(editor) {
            subs.add(editor.onDidSave(lintOnSave))
            subs.add(editor.onDidStopChanging(lintOnTheFly))
            subs.add(editor.onDidDestroy(cleanupMessages))
        })
    }
}
