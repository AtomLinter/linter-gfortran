'use babel';

import * as path from 'path';

const { lint } = require('../lib/main.js').provideLinter();

const FILES = path.join(__dirname, 'files');

describe('The Fortran provider for AtomLinter', () => {
  beforeEach(() => {
    waitsForPromise(() => atom.packages.activatePackage('linter-gfortran'));
  });

  it('finds an error in "error.f95"', () => {
    waitsForPromise(() => atom.workspace.open(path.join(FILES, 'error.f95')).then(editor =>
      lint(editor).then((messages) => {
        expect(messages.length).toEqual(1);
        expect(messages[0].severity).toEqual('error');
        expect(messages[0].excerpt).toEqual('Unterminated character constant beginning at (1)');
      })));
  });

  it('works with modules in "module.f95"', () => {
    waitsForPromise(() => atom.workspace.open(path.join(FILES, 'module.f95')).then(editor =>
      lint(editor).then((messages) => {
        expect(messages.length).toEqual(0);
      })));
  });
});
