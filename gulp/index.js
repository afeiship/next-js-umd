(function() {

  'use strict';

  var gulp = require('gulp');


  //default
  gulp.task('default', ['clean'], function() {
    gulp.start(['build']);
  });


}());
