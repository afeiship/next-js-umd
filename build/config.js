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
      rootPath + '/src/path.js',
      rootPath + '/src/status.js',
      rootPath + '/src/module.js',
      rootPath + '/src/loader.js',
      rootPath + '/src/index.js'
    ]
  };

}());
