module.exports = function(config) {
    config.set({
        basePath: '',

        // frameworks to use
        frameworks: ['jasmine', 'browserify'],

        files: ['test/*'],
        exclude: [],
        reporters: ['progress'],
        port: 9876,
        runnerPort: 9100,

        colors: true,
        logLevel: config.LOG_DEBUG,
        autoWatch: true,
        browsers: ['Chrome'],
        captureTimeout: 60000,
        singleRun: false,

        // Browserify config
        browserify: {
            watch: true,
        },

        // Add browserify to preprocessors
        preprocessors: {'test/*': ['browserify']}
    });
};