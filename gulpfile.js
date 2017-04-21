'use strict';

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const tsc = require('gulp-typescript');
const del = require('del');

gulp.task('clean', () => del([
  'lib',
  'es'
]));

gulp.task('build:es', () =>
  gulp.src('src/**/*.ts')
  .pipe(tsc.createProject('tsconfig.json', {
    module: 'es2015'
  })())
  .on('error', err => {
    process.exit(1);
  })
  .pipe(gulp.dest('es'))
);

gulp.task('build:lib', () =>
  gulp.src('src/**/*.ts')
  .pipe(tsc.createProject('tsconfig.json')())
  .on('error', err => {
    process.exit(1);
  })
  .pipe(gulp.dest('lib'))
);

gulp.task('build', gulp.series(
  'build:es',
  'build:lib'
));
