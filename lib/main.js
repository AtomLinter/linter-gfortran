'use babel'

import {
    CompositeDisposable
}
from 'atom'

var utility = require("./utility");
var tmp = require('tmp');

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
    tmp_file : tmp.fileSync(),
    tmp_dir : tmp.dirSync(),

    lint: function(editor, file, path){
        const helpers=require("atom-linter");
        const regex = "(.+):(?<line>\\d+):(?<col>\\d+):((.|\\n)*)(?<type>(Error|Warning|Note)):\\s*(?<message>.*)"
        command = utility.buildCommand(editor, file);

        // Handle module by forcing gfortran to write them to the temporary
        // directory, and reading them from there.
        command.args.push("-J");
        command.args.push(module.exports.tmp_dir.name);
        command.args.push("-I");
        command.args.push(module.exports.tmp_dir.name);

        return helpers.exec(command.binary, command.args, {stream: "stderr"}).then(output => {
            msgs = helpers.parse(output, regex)
            module.exports.messages[path] = msgs;
            if (typeof module.exports.linter_gfortran != "undefined"){
                module.exports.linter_gfortran.setMessages(utility.flattenHash(module.exports.messages))
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
        utility = utility
        lintOnTheFly = function() {
            editor = utility.getValidEditor(atom.workspace.getActiveTextEditor());
            if (!editor) return;
            if (atom.config.get("linter-gfortran.gfortranLintOnTheFly") == false) return;
            var tmp_path = module.exports.tmp_file.name;
            require('fs-extra').outputFileSync(tmp_path, editor.getText());
            module.exports.lint(editor, tmp_path, editor.getPath());
        };

        lintOnSave = function(){
            editor = utility.getValidEditor(atom.workspace.getActiveTextEditor());
            if (!editor) return;
            if (atom.config.get("linter-gfortran.gfortranLintOnTheFly") == true) return;
            path = editor.getPath();
            module.exports.lint(editor, path, path);
        };

        cleanupMessages = function(){
            module.exports.linter_gfortran.setMessages(utility.flattenHash(module.exports.messages));
        };

        subs.add(module.exports.linter_gfortran)

        atom.workspace.observeTextEditors(function(editor) {
            subs.add(editor.onDidSave(lintOnSave))
            subs.add(editor.onDidStopChanging(lintOnTheFly))
            subs.add(editor.onDidDestroy(cleanupMessages))
        })
    }
}
