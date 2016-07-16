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
        const path = require('path')
        const regex = ".+:(?<line>\\d+)[\.:](?<col>\\d+):((.|\\r|\\n)*)(?<type>(Error|Warning|Note)):\\s*(?<message>.*)";
        const tmpdir = require('tmp').dirSync().name;
        return {
            name: "gfortran",
            grammarScopes: [
                "source.fortran.free",
                "source.fortran.fixed",
                "source.fortran.modern",
                "source.fortran.punchcard"
            ],
            scope: "project",
            lintOnFly: true,
            lint: (activeEditor) => {
              const command = atom.config.get("linter-gfortran.executable");
              const fileContents = activeEditor.getText()
              const filePath = activeEditor.getPath();
              const args = ["-fsyntax-only", "-J", tmpdir];

              return helpers.tempFile(path.basename(filePath), fileContents, (tmpFilename) => {
                args.push(tmpFilename);
                return helpers.exec(command, args, { stream: "stderr"}).then(output => {
                    return helpers.parse(output, regex, { filePath : filePath });
                    });
                });
          }
        };
    }
};
