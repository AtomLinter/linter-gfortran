'use strict';

var path = require('path');
var fs = require('fs');

module.exports.settings = function () {
    return {
        execPath: atom.config.get("linter-gfortran.execPath"),
        gfortranDefaultFlags: atom.config.get("linter-gfortran.gfortranDefaultFlags"),
    };
};
