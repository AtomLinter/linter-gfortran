'use babel';

// Internal variabls
const idleCallbacks = new Set();

// Dependencies
let helpers;
let path;
let tmpdir;

const VALID_SEVERITY = new Set(['error', 'warning', 'info']);
const regex = /([^\n:]+):(\d+)[.:](\d+)?:(.|\r|\n)*(Error|Warning|Note):\s*(.*)/g;

const getSeverity = (givenSeverity) => {
  const severity = givenSeverity.toLowerCase();
  return VALID_SEVERITY.has(severity) ? severity : 'warning';
};

const loadDeps = () => {
  if (!helpers) {
    helpers = require('atom-linter');
  }
  if (!path) {
    path = require('path');
  }
  if (!tmpdir) {
    tmpdir = require('tmp').dirSync().name;
  }
};

export default {
  activate() {
    let depsCallbackId;
    const lintergfortranDeps = () => {
      idleCallbacks.delete(depsCallbackId);
      require('atom-package-deps').install('linter-gfortran');
      loadDeps();
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
      lintsOnChange: true,
      lint: (activeEditor) => {
        loadDeps();

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

        const execOpts = {
          stream: 'stderr',
          allowEmptyStderr: true,
        };

        // Execute gfortran on a temporary file in order for on-the-fly linter to work.
        return helpers.tempFile(path.basename(filePath), fileContents, (tmpFilename) => {
          args.push(tmpFilename);

          return helpers.exec(command, args, execOpts).then((output) => {
            const messages = [];

            let match = regex.exec(output);
            while (match !== null) {
              const severity = getSeverity(match[5]);
              const line = Number.parseInt(match[2], 10) - 1;
              const col = Number.parseInt(match[3], 10);
              const excerpt = match[6];
              messages.push({
                severity,
                excerpt,
                location: {
                  file: filePath,
                  position: helpers.generateRange(activeEditor, line, col),
                },
              });
              match = regex.exec(output);
            }
            return messages;
          });
        });
      },
    };
  },
};
