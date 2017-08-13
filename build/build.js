(function() {

  'use strict';

  var gulp = require('gulp');
  var config = require('./config');
  var argv = require('yargs').argv;
  var $ = require('gulp-load-plugins')({
    pattern: ['gulp-*', 'gulp.*', 'del']
  });

  gulp.task('build',function () {
    return gulp.src(config.files)
      .pipe($.concat('next-umd.js'))
      .pipe(gulp.dest('dist'))
      .pipe($.size({title:'[ default size ]:'}))
      .pipe($.rename({suffix: '.min'}))
      .pipe($.uglify())
      .pipe(gulp.dest('dist'))
      .pipe($.size({title:'[ compressed size ]:'}))
      .pipe($.notify({ message: 'Scripts common task complete' }));
  });


}());
