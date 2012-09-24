(function(undefined) {
    'use strict';

    var install = require('./install'),
        init    = require('./init'),
        grunt   = require('grunt'),
        moddir  = require('path').dirname(module.filename) + '/..';

    var api = {

            "--version": function() {
                grunt.log.writeln(['JetFuel version', require('./version').call()].join(' '));
            },

            install: function() {
                install.apply(install, arguments);
            },

            init: function() {
                init.apply(init, arguments);
            }

        };

    function loadGruntTask(force, done) {
        loadJetFuelTasks();
        require('util').puts('\nRunning Grunt...\n');
        grunt.cli({ force: force }, done);
    }

    function loadJetFuelTasks() {
        var pwd = process.cwd();
        process.chdir(moddir);
        grunt.loadNpmTasks('jetfuel.grunt.tasks');
        grunt.loadNpmTasks('grunt-jasmine-task');
        process.chdir(pwd);
    }

    module.exports = function() {
        return (api[process.argv[2]] || loadGruntTask).apply(this, process.argv.slice(3));
    };

})(undefined);