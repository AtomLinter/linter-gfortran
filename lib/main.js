"use babel";

export default {
    config: {
        executable: {
            type: "string",
            default: "gfortran"
        },
        gfortran_flags: {
            type: "string",
            default: "-Wall -Wextra"
        },
    },

    activate: () => {
        require("atom-package-deps").install("linter-gfortran");
    },

    provideLinter: () => {
        const helpers = require("atom-linter");
        const regex = "(?<file>.+):(?<line>\\d+)[\.:](?<col>\\d+):((.|\\r|\\n)*)(?<type>(Error|Warning|Note)):\\s*(?<message>.*)";
        const tmpdir = require('tmp').dirSync().name;
        return {
            name: "gfortran",
            grammarScopes: [
                "source.fortran.free",
                "source.fortran.fixed",
                "source.fortran.modern",
                "source.fortran.punchcard"
            ],
            scope: "file",
            lintOnFly: true,
            lint: async (activeEditor) => {
                const command = atom.config.get("linter-gfortran.executable");
                const fileContents = activeEditor.getText()

                const args = ["-fsyntax-only", "-J", tmpdir];

                return helpers.execNode(command, args, {stdin: fileContents, stream: "stderr"}).then(output =>
                    helpers.parse(output, regex)
                );
            }
        };
    }
};
