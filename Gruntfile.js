module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        browserify: {
            build: {
                files: {
                    "js/yoast-acf-analysis.js": [ "js/src/yoast-acf-analysis.js" ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');

    grunt.registerTask('default', ['browserify']);

};