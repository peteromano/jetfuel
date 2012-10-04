(function(undefined) {
    'use strict';

    var ERROR_CONFIG_NOT_FOUND  = 2,
        JETFUEL_FILE            = 'jetfuel.json',
        ENOENT                  = 'ENOENT';

    var grunt, bower;

    var util = require('util'),
        api = {

            "--version": function() {
                console.log(['\nJetFuel version', require('./version').call() + '\n'].join(' '));
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
                    try {
                        bower = require('bower');
                    } catch(e) {
                        util.error('\nMissing BOWER package manager dependency!\n');
                        process.exit(3);
                    }
                }
            },

            grunt: function() {
                loadGrunt(function() {
                    grunt.cli.tasks.shift();
                });
            }

        };

    function loadGrunt(beforeLoad) {
        if(loadJetfuelConfig()) {
            try {
                grunt = require('grunt');
            } catch(e) {
                util.error('\nMissing GRUNT build tool dependency!\n');
                process.exit(3);
            }

            beforeLoad();
            require('util').puts('\nRunning Grunt...\n');
            loadNpmTasks();
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
            process.jetfuel = require('./util').readJSON(JETFUEL_FILE);
            process.jetfuel.path = process.cwd();
        } catch(e) {
            if(e.code != ENOENT) util.error(e);
            else {
                util.error('\nMissing ' + JETFUEL_FILE + ' configuration file!\n');
                process.exit(ERROR_CONFIG_NOT_FOUND);
            }
        }

        return true;
    }

    module.exports = function() {
        return (api[process.argv[2]] || loadGrunt).apply(this, process.argv.slice(3));
    };

})(undefined);