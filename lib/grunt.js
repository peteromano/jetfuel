// All filepaths referenced in any loaded modules are relative to the grunt.js directory, recursively, unless absolute
module.exports = function(grunt) {
    'use strict';

    var path = process.jetfuel.path + '/',
        config = process.jetfuel.grunt.config;

    process.chdir(path);

    require(path + config.tasks)(grunt);

    grunt.initConfig(
        grunt.utils._.extend({
            pkg: require(path + config.pkg),
            meta: require(path + config.meta),
            concat: require(path + config.concat)
        }, require(path + config.targets))
    );

};