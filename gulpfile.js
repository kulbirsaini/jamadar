'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var cached = require('gulp-cached');

var paths = {
  jshint: ['*.js', 'test/*.js'],
  mocha: ['test/**/*.js']
};

gulp.task('dev-env', function() {
  process.env.NODE_ENV = 'development';
});

gulp.task('test-env', function() {
  process.env.NODE_ENV = 'test';
});

gulp.task('jshint', ['dev-env'], function() {
  return gulp.src(paths.jshint)
    .pipe(cached('lint-files'))
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('mocha', ['test-env'], function() {
  return gulp.src(paths.mocha)
    .pipe(cached('spec-files'))
    .pipe(mocha({ reporter: 'nyan' }));
});

gulp.task('watch', function() {
  gulp.watch(paths.jshint, ['jshint']);
  gulp.watch(paths.mocha, ['mocha']);
});

gulp.task('dev', ['jshint'], function() {
});

gulp.task('test', ['mocha'], function() {
});

gulp.task('default', ['watch', 'dev', 'test']);
