module.exports = {
  flattenHash: function(obj){
    var array = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)){
        obj[key].forEach( function(entry){
          array.push(entry);
        });
      }
    }
    return array;
  },
  getValidEditor: function(editor){
    if (!editor) return undefined;
    grammar = editor.getGrammar().name;
    const valid_grammars = {
      "Fortran - Modern": "",
      "Fortran - Free Form": "",
      "Fortran - Punchcard": "",
      "Fortran - Fixed Form": "",
    };
    if (!valid_grammars.hasOwnProperty(grammar)) {
      return undefined;
    }
    return editor;
  },
  getCwd: function() {
    var cwd = atom.project.getPaths()[0]
    if (!cwd) {
      editor = atom.workspace.getActivePaneItem();
      if (editor) {
        temp_file = editor.buffer.file;
        if (temp_file) {
          cwd = temp_file.getParent().getPath();
        }
      }
    }
    return cwd;
  },
  splitStringTrim: function(str, delim, expandPaths, itemPrefix){
    output = [];
    str = str.trim();
    if (str.length == 0){
      return output;
    }
    temp_arr = require("split-string")(str, delim);
    temp_arr.forEach(function(item){
      item = item.trim();
      if (item.length > 0){
        if (item.substring(0, 1) == "." && expandPaths) {
          item = require("path").join(cwd, item);
        }
        item = itemPrefix + item;
        output.push(item)
      }
    });
    return output;
  },
  buildCommand: function(activeEditor, file) {
    var config = require("./config");
    var path = require('path');
    settings = config.settings();
    cwd = module.exports.getCwd();
    command = settings.execPath;

    // Expand path if necessary
    if (command.substring(0, 1) == ".") {
      command = path.join(cwd, command);
    }

    // Cross-platform $PATH expansion
    command = require("shelljs").which(command);
    if (!command) {
      atom.notifications.addError(
        "linter-gfortran: Executable not found", {
          detail: "\"" + settings.execPath + "\" not found"
        }
      );
      return;
    }

    args = [];
    var flags = settings.gfortranDefaultFlags;
    var flag_array = module.exports.splitStringTrim(flags, " ", false, "");
    args = args.concat(flag_array);

    args.push(file);
    full_command = "linter-gfortran: " + command;
    args.forEach(function(entry) {
      full_command = full_command + " " + entry;
    });

    console.log(full_command);
    return {binary: command, args: args};
  }
}
