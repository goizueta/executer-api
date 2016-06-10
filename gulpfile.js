var karma = require('gulp-karma'),
    gulp = require('gulp'),
    nodemon = require('gulp-nodemon'),
    path = require('path'),
    protractor = require('gulp-protractor').protractor,
    source = require('vinyl-source-stream'),
    stringify = require('stringify'),
    watchify = require('watchify'),
    mocha = require('gulp-mocha'),
    exit = require('gulp-exit');

var paths = {
    clientTests: [],
    serverTests: ['test/server/**/*.js']
};

gulp.task('nodemon', function () {
    nodemon({ script: 'index.js', ext: 'js', ignore: ['node_modules/**'] })
    .on('restart', function () {
        console.log('>> node restart');
    });
});

gulp.task('test:server', ['test:client'], function() {
    return gulp.src(paths.serverTests)
    .pipe(mocha({
        reporter: 'spec',
        timeout: 50000
    }))
    .pipe(exit());
});

gulp.task('production', ['nodemon']);
gulp.task('default', ['nodemon']);
