'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');

var livereload = require('gulp-livereload');
var connect = require('connect');

var rename = require('gulp-rename');
var browserify = require('browserify');
var watchify = require('watchify');
var es6ify = require('es6ify');
var reactify = require('reactify');
var source = require('vinyl-source-stream');
var shim = require('browserify-shim');
var jshint = require('gulp-jshint');
var react = require('gulp-react');
var cache = require('gulp-cached');


/** Config variables */
var serverPort = 8888;
var lrPort = 35731;


/** File paths */
var dist = 'dist';

var htmlFiles = 'app/**/*.html';
var htmlBuild = dist;

var jsxFiles = 'app/jsx/**/*.jsx';

var libFiles = [
    'node_modules/es6ify/node_modules/traceur/bin/traceur-runtime.js'
];

var libBuild = dist + '/js';
var requireFiles = [
    './node_modules/react/react.js',
    './node_modules/underscore/underscore.js'
];


gulp.task('lib', function () {
    gulp.src(libFiles).
        pipe(gulp.dest(libBuild));

    return browserify()
        .require('underscore')
        .require('react')
        .bundle()
        .on('error', function() { console.log("error in lib task") })
        .pipe(source('lib.js'))
        .pipe(gulp.dest(libBuild))
});


gulp.task('html', function () {
    return gulp.src(htmlFiles).
        pipe(gulp.dest(htmlBuild));
});

gulp.task("lint", function() {
    //gulp.src("./js/*.js")
    //    .pipe(jsxhint())
    //    .pipe(jsxhint.reporter("default"));
    var stream = gulp.src("./js/**/*.js")
        .pipe(cache('jshint'))
        .pipe(react())
        .on('error', function(err) {
            console.error('JSX ERROR in ' + err.fileName);
            console.error(err.message);
            this.end();
        })
        .pipe(jshint({
            esnext: true
        }))
        .pipe(jshint.reporter('default'));

    if (process.env.CI) {
        stream = stream.pipe(jshint.reporter('fail'));
    }

    return stream;
});


function compileScripts(watch) {
    gutil.log('Starting browserify');

    var entryFile = './js/app.js';
    es6ify.traceurOverrides = {experimental: true};

    var bundler;
    if (watch) {
        console.log("watch")
        bundler = watchify(entryFile);
    } else {
        bundler = browserify(entryFile);
    }

    bundler.external('underscore')
    bundler.external('react')
    bundler.transform(reactify);
    bundler.transform(es6ify);

    var rebundle = function () {
        console.log("rebundle")
        var stream = bundler.bundle({ debug: true});

        stream.on('error', function (err) { console.error(err) });
        stream = stream.pipe(source(entryFile));
        stream.pipe(rename('app.js'));

        stream.pipe(gulp.dest('dist/bundle'));
    };

    bundler.on('update', rebundle);
    return rebundle();
}


gulp.task('server', function (next) {
    var server = connect();
    server.use(connect.static(dist)).listen(serverPort, next);
});


function initWatch(files, task) {
    if (typeof task === "string") {
        gulp.start(task);
        gulp.watch(files, [task]);
    } else {
        task.map(function (t) { gulp.start(t) });
        gulp.watch(files, task);
    }
}


/**
 * Run default task
 */
gulp.task('default', ['lib', 'server'], function () {
    var lrServer = livereload(lrPort);
    var reloadPage = function (evt) {
        lrServer.changed(evt.path);
    };

    function initWatch(files, task) {
        gulp.start(task);
        gulp.watch(files, [task]);
    }

    compileScripts(true);
    initWatch(htmlFiles, 'html');

    gulp.watch([dist + '/**/*'], reloadPage);
});