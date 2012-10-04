(function(undefined) {
    'use strict';

    var JETFUEL_FILE = 'jetfuel.json',
        ENOENT = 'ENOENT';

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
                if(loadJetfuelConfig()) {

                }
            },

            grunt: function() {
                grunt.cli.tasks.shift();
                loadGruntTask();
            }

        };

    function loadGruntTask() {
        if(loadJetfuelConfig()) {
            loadNpmTasks();
            require('util').puts('\nRunning Grunt...\n');
            grunt.cli({ config: __dirname + '/grunt.js' });
        }
    }

    function loadNpmTasks() {
        var pwd = process.cwd();
        process.chdir(__dirname + '/..');
        grunt.loadNpmTasks('jetfuel.grunt.tasks');
        process.chdir(pwd);
    }

    function loadJetfuelConfig(){
        try {
            process.jetfuel = grunt.file.readJSON(JETFUEL_FILE);
            process.jetfuel.path = process.cwd();
        } catch(e) {
            if(e.origError.code == ENOENT) require('util').error('\nMissing .jetfuel.json configuration file!\n')
            else require('util').error(e);
            return false;
        }

        return true;
    }

    module.exports = function() {
        return (api[process.argv[2]] || loadGruntTask).apply(this, process.argv.slice(3));
    };

})(undefined);