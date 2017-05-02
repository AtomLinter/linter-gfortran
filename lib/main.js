'use babel';

// Internal variabls
const idleCallbacks = new Set();

// Dependencies
let helpers;
let path;
let tmpdir;
let regex;

export default {
  activate() {
    let depsCallbackId;
    const lintergfortranDeps = () => {
      idleCallbacks.delete(depsCallbackId);
      require('atom-package-deps').install('linter-gfortran');
    };
    depsCallbackId = window.requestIdleCallback(lintergfortranDeps);
    idleCallbacks.add(depsCallbackId);
  },

  deactivate() {
    idleCallbacks.forEach(callbackID => window.cancleIdleCallback(callbackID));
    idleCallbacks.clear();
  },

  provideLinter() {
    return {
      name: 'gfortran',
      grammarScopes: [
        'source.fortran.free',
        'source.fortran.fixed',
        'source.fortran.modern',
        'source.fortran.punchcard',
      ],
      scope: 'file',
      lintOnFly: true,
      lint: (activeEditor) => {
        if (!helpers) {
          path = require('path');
          tmpdir = require('tmp').dirSync().name;
          helpers = require('atom-linter');
          regex = '(?<file>[^\n:]+):(?<line>\\d+)([.:](?<col>\\d+))?:((.|\\r|\\n)*?)(?<type>(Error|Warning|Note)):\\s*(?<message>.*)';
        }
        const command = atom.config.get('linter-gfortran.executable');
        const fileContents = activeEditor.getText();
        const filePath = activeEditor.getPath();
        const fileDir = path.dirname(filePath);

        // Split the users flag string and append flags to specific syntax
        // checking and temporary file directory.
        const args = atom.config.get('linter-gfortran.gfortran_flags')
          .split(' ')
          .concat(['-fsyntax-only'])
          .concat(['-J', tmpdir])
          .concat(['-I', fileDir]);

        // Execute gfortran on a temporary file in order for on-the-fly linter to work.
        return helpers.tempFile(path.basename(filePath), fileContents, (tmpFilename) => {
          args.push(tmpFilename);
          return helpers.exec(command, args, { stream: 'stderr' }).then((output) => {
            const errors = helpers.parse(output, regex, { filePath });
            return errors.map((error) => {
              const message = error;
              if (tmpFilename.includes(message.filePath)) {
                // Set main file path to the real path instead of the temporary file path
                message.filePath = filePath;
              } else if (!path.isAbsolute(message.filePath)) {
                // Set others file path to be relative to the main file path
                message.filePath = `${fileDir}/${message.filePath}`;
              }
              return message;
            });
          });
        });
      },
    };
  },
};
