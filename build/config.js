(function() {

  'use strict';

  var rootPath = process.cwd();

  module.exports = {
    path: {
      root: rootPath,
      src: 'src',
      dist: 'dist',
      gulp: 'gulp',
    },
    files: [
      rootPath + '/src/Path.js',
      rootPath + '/src/Status.js',
      rootPath + '/src/Module.js',
      rootPath + '/src/Loader.js',
      rootPath + '/src/index.js'
    ]
  };

}());
