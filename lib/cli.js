(function(undefined) {
    'use strict';

    var ERROR_CONFIG_NOT_FOUND  = 2,
        JETFUEL_FILE            = 'jetfuel.json',
        CONFIG_NOT_FOUND_MSG    = '\nMissing ' + JETFUEL_FILE + ' configuration file!\n',
        ENOENT                  = 'ENOENT';

    var grunt, bower;

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
                    bower = require('bower');
                }
            },

            grunt: function() {
                grunt.cli.tasks.shift();
                loadGrunt();
            }

        };

    function loadGrunt() {
        if(loadJetfuelConfig()) {
            grunt = require('grunt');
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
            process.jetfuel = grunt.file.readJSON(JETFUEL_FILE);
            process.jetfuel.path = process.cwd();
        } catch(e) {
            if(e.origError.code != ENOENT) require('util').error(e);
            else {
                require('util').error(CONFIG_NOT_FOUND_MSG);
                process.exit(ERROR_CONFIG_NOT_FOUND);
            }
        }

        return true;
    }

    module.exports = function() {
        return (api[process.argv[2]] || loadGrunt).apply(this, process.argv.slice(3));
    };

})(undefined);