"use babel";

describe('The Fortran provider for AtomLinter', () => {
    const main = require('../lib/main')
    const utility = require('../lib/utility.js')
    var settings = require("../lib/config").settings

    beforeEach(() => {
        waitsForPromise(() => {
            atom.config.set('linter-gfortran.execPath', 'gfortran');
            atom.config.set('linter-gfortran.gfortranDefaultFlags', '-fsyntax-only -Wall -Wextra');
            atom.config.set('linter-gfortran.gfortranLintOnTheFly', false);
            main.messages={};
            return atom.packages.activatePackage('linter-gfortran')
        })
    })

    it('finds one error in error.f95', () => {
        waitsForPromise(() => {
            filename = __dirname + '/files/error.f95'
            return atom.workspace.open(filename).then(editor => {
                main.lint(editor, editor.getPath(), editor.getPath()).then(function(){
                    var length = utility.flattenHash(main.messages).length
                    expect(length).toEqual(1);
                })
            })
        })
    })

    it('finds no errors in comment.f95', () => {
        waitsForPromise(() => {
            filename = __dirname + '/files/comment.f95'
            return atom.workspace.open(filename).then(editor => {
                main.lint(editor, editor.getPath(), editor.getPath()).then(function(){
                    var length = utility.flattenHash(main.messages).length
                    expect(length).toEqual(0);
                })
            })
        })
    })

})
