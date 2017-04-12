"use babel";

// Internal variabls
const idleCallbacks = new Set();

// Dependencies
let helpers;
let path;
let tmpdir;
let regex;

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

    activate() {
        const depsCallbackId = window.requestIdleCallback(function linterGfortranDeps() {
            idleCallbacks.delete(depsCallbackId);
            require("atom-package-deps").install("linter-gfortran");
        });
        idleCallbacks.add(depsCallbackId);
    },

    deactivate() {
        idleCallbacks.forEach(callbackID => window.cancleIdleCallback(callbackID));
        idleCallbacks.clear();
    },

    provideLinter() {
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
                if (!helpers) {
                    path = require('path');
                    tmpdir = require('tmp').dirSync().name;
                    helpers = require("atom-linter");
                    regex = "(?<file>[^\n:]+):(?<line>\\d+)([\.:](?<col>\\d+))?:((.|\\r|\\n)*?)(?<type>(Error|Warning|Note)):\\s*(?<message>.*)";
                }
                const command = atom.config.get("linter-gfortran.executable");
                const fileContents = activeEditor.getText();
                const filePath = activeEditor.getPath();
                const fileDir = path.dirname(filePath);

                // Split the users flag string and append flags to specific syntax checking and temporary file directory.
                const args = atom.config
                                 .get("linter-gfortran.gfortran_flags")
                                 .split(" ")
                                 .concat(["-fsyntax-only"])
                                 .concat(["-J", tmpdir])
                                 .concat(["-I", fileDir]);

                // Execute gfortran on a temporary file in order for on-the-fly linter to work.
                return helpers.tempFile(path.basename(filePath), fileContents, (tmpFilename) => {
                    args.push(tmpFilename);
                    return helpers.exec(command, args, { stream: "stderr"}).then(output => {
                        errors = helpers.parse(output, regex, { filePath : filePath });
                        errors.forEach((error) => {
                            if (error.filePath == tmpFilename) {
                                // Set main file path to the real path instead
                                // of the temporary file path
                                error.filePath = filePath;
                            } else {
                                // Set others file path to be relative to the
                                // main file path
                                if (! path.isAbsolute(error.filePath)) {
                                    error.filePath = fileDir + "/" + error.filePath;
                                }
                            }
                        });
                        return errors;
                    });
                });
            }
        };
    }
};
