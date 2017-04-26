'use strict';

const gulp = require('gulp');
const tsc = require('gulp-typescript');
const del = require('del');

gulp.task('clean', () => del([
  'lib',
  'es',
  'npm-debug.log*',
  'src/**/*.js',
  'test/**/*.js'
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
  .pipe(tsc.createProject('tsconfig.json', {
    declaration: true
  })())
  .on('error', err => {
    process.exit(1);
  })
  .pipe(gulp.dest('lib'))
);

gulp.task('build:src', () =>
  gulp.src('src/**/*.ts')
  .pipe(tsc.createProject('tsconfig.json')())
  .on('error', err => {
    process.exit(1);
  })
  .pipe(gulp.dest('src'))
);

gulp.task('build:test', () =>
  gulp.src('test/**/*.ts')
  .pipe(tsc.createProject('tsconfig.json')())
  .on('error', err => {
    process.exit(1);
  })
  .pipe(gulp.dest('test'))
);

gulp.task('build', gulp.series(
  'build:es',
  'build:lib',
  'build:src',
  'build:test'
));
