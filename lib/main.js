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
            lintOnFly: false,
            lint: (activeEditor) => {
                const command = atom.config.get("linter-gfortran.executable");
                const file = activeEditor.getPath();

                const args = ["-fsyntax-only", "-J", tmpdir];
                args.push(file);

                return helpers.exec(command, args, {stream: "stderr"}).then(output =>
                    helpers.parse(output, regex)
                );
            }
        };
    }
};
