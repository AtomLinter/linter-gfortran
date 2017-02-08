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
        const path = require('path');
        const regex = ".+:(?<line>\\d+)([\.:](?<col>\\d+))?:((.|\\r|\\n)*?)(?<type>(Error|Warning|Note)):\\s*(?<message>.*)";
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
            lint: (activeEditor) => {
              const command = atom.config.get("linter-gfortran.executable");
              const fileContents = activeEditor.getText()
              const filePath = activeEditor.getPath();

              // Split the users flag string and append flags to specific syntax checking and temporary file directory.
              const args = atom.config
                .get("linter-gfortran.gfortran_flags")
                .split(" ")
                .concat(["-fsyntax-only", "-J", tmpdir]);

              // Execute gfortran on a temporary file in order for on-the-fly linter to work.
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
