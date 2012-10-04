(function(undefined) {
    'use strict';

    var ENOENT = 'ENOENT';

    var grunt = require('grunt'),
        bower = require('bower');

    var api = {

            "--version": function() {
                grunt.log.writeln(['JetFuel version', require('./version').call()].join(' '));
            },

            install: function() {
                var install = require('./install');
                install.apply(install, arguments);
            },

            init: function() {
                var init = require('./init');
                init.apply(init, arguments);
            },

            bower: function() {

            }

        };

    function loadGruntTask(force, done) {
        loadJetFuelTasks();
        require('util').puts('\nRunning Grunt...\n');
        grunt.cli({ force: force, config: __dirname + '/grunt.js' }, done);
    }

    function loadJetFuelTasks() {
        var pwd = process.cwd();
        process.chdir(__dirname + '/..');
        grunt.loadNpmTasks('jetfuel.grunt.tasks');
        process.chdir(pwd);
    }

    module.exports = function() {
        try {
            process.jetfuel = grunt.file.readJSON('.jetfuel.json');
            process.jetfuel.path = process.cwd();
        } catch(e) {
            if(e.origError.code == ENOENT) require('util').error('\nMissing .jetfuel.json configuration file!\n')
            else require('util').error(e);
            return this;
        }

        return (api[process.argv[2]] || loadGruntTask).apply(this, process.argv.slice(3));
    };

})(undefined);