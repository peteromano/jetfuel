// All filepaths referenced in any loaded modules are relative to the grunt.js directory, recursively, unless absolute
module.exports = function(grunt) {
    'use strict';

    var config = process.jetfuel.config.grunt,
        tasks = config.tasks,
        methods = {
            rename: grunt.renameTask,
            register: grunt.registerTask
        };

    process.chdir(process.jetfuel.env.PATH);

    for(var method in tasks)
        for(var task in tasks[method])
            typeof methods[method] == 'function' && methods[method](task, tasks[method][task]);

    grunt.renameTask('concatenate', 'concat');

    grunt.initConfig(
        grunt.utils._.extend({
            pkg: config.pkg,
            meta: config.meta
        }, config.targets)
    );

};