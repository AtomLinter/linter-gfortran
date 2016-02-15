"use babel";

describe('Utility functions', () => {
    const utility = require('../lib/utility.js')

    beforeEach(() => {
        waitsForPromise(() => {
            atom.config.set('linter-gfortran.execPath', 'gfortran');
            atom.config.set('linter-gfortran.gfortranDefaultFlags', '-fsyntax-only -Wall -Wextra');
            atom.config.set('linter-gfortran.gfortranLintOnTheFly', false);

            atom.packages.activatePackage("language-javascript");
            atom.packages.activatePackage('linter-gfortran');
            return atom.packages.activatePackage("language-fortran");
        })
    })

    it('returns an editor for a Fortran file', () => {
        waitsForPromise(() => {
            return atom.workspace.open(__dirname + '/files/test.f95').then(editor => {
                expect(utility.getValidEditor(editor)).toBeDefined();
            })
        })
    })

    it('returns undefined for a javascript file', () => {
        waitsForPromise(() => {
            return atom.workspace.open(__dirname + '/../lib/utility.js').then(editor => {
                expect(utility.getValidEditor(editor)).not.toBeDefined();
            })
        })
    })
})
