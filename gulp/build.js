(function() {

  'use strict';

  var gulp = require('gulp');
  var config = require('./config');
  var argv = require('yargs').argv;
  var $ = require('gulp-load-plugins')({
    pattern: ['gulp-*', 'gulp.*', 'del']
  });
  var jsFilter = $.filter(['*'], {restore: true});


  gulp.task('build',function () {
    console.log(config);
    return gulp.src(config.files)
      .pipe($.debug())
      .pipe($.concat('next-js-umd.js'))
      .pipe(gulp.dest('dist'))
      .pipe($.rename({suffix: '.min'}))
      .pipe($.uglify())
      .pipe(gulp.dest('dist'))
      .pipe($.notify({ message: 'Scripts common task complete' }));
  });


}());
