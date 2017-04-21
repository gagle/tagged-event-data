'use strict';

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const tsc = require('gulp-typescript');
const del = require('del');

gulp.task('clean', () => del([
  'lib',
  'es',
  'src/**/*.js',
  'src/**/*.js.map',
  'src/**/*.d.ts',
  'test/**/*.js',
  'test/**/*.js.map*',
  'test/**/*.d.ts'
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

gulp.task('build:src', () =>
  gulp.src('src/**/*.ts')
  .pipe(sourcemaps.init())
  .pipe(tsc.createProject('tsconfig.json')())
  .on('error', err => {
    process.exit(1);
  })
  .js.pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('src'))
);

gulp.task('build:test', () =>
  gulp.src('test/**/*.ts')
  .pipe(sourcemaps.init())
  .pipe(tsc.createProject('tsconfig.json')())
  .on('error', err => {
    process.exit(1);
  })
  .js.pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('test'))
);

gulp.task('build', gulp.series(
  'build:es',
  'build:lib',
  'build:src',
  'build:test'
));
