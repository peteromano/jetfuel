(function(undefined) {
    'use strict';

    var ERROR_CONFIG_NOT_FOUND  = 2,
        ERROR_DEP_NOT_FOUND     = 3,
        DEFAULT_BOWER_COMMAND   = 'help',
        GRUNT_FILE              = 'grunt.js',
        JETFUEL_FILE            = 'jetfuel.json',
        ENOENT                  = 'ENOENT';

    var util = require('util'),
        directories = [],
        args,

        components = {

            grunt: {
                name: 'Grunt',
                loaded: null,
                require: 'grunt',
                on: { load: grunt },
                config: {
                    npmTasks: ['jetfuel.grunt.tasks']
                }
            },

            bower: {
                name: 'Bower',
                loaded: null,
                require: 'bower',
                on: { load: bower }
            }

        },

        cli = {

            "--version": function() {
                util.puts(['\nJetFuel version', require('./version').call() + '\n'].join(' '));
            },

            install: function() {
                var install = require('./install');
                install.apply(install, args);
            },

            init: function() {
                var init = require('./init');
                init.apply(init, args);
            },

            grunt:  curry(load, [components.grunt.require]),
            bower:  curry(load, [components.bower.require])

        };

    function jetfuel() {
        load(components.grunt.require, { facade: true });
    }

    function curry(fn, args, ctx) {
       return function() {
         return fn.apply(ctx || this, args);
       }
    }

    function pushd(directory) {
        directories.push(process.cwd());
        process.chdir(directory);
    }

    function popd() {
        return directories.pop();
    }

    function bower(component, options) {
        var commands = component.commands;
        (commands[args[0]] || commands[DEFAULT_BOWER_COMMAND]).apply(component, [args.splice(1)]);
    }

    function grunt(component, options) {
        !options.args.facade && component.cli.tasks.shift();

        pushd(__dirname + '/..');

        options.config.npmTasks.forEach(function() {
            component.loadNpmTasks('jetfuel.grunt.tasks');
        });

        popd();

        component.cli({ config: __dirname + '/' + GRUNT_FILE });
    }

    function load(component, args) {
        component = components[component];

        var on = component.on || {};

        try {

            process.jetfuel = require('./util').readJSON(JETFUEL_FILE);
            process.jetfuel.path = process.cwd();

        } catch(e) {

            if(e.code != ENOENT) throw e;
            else {
                util.error('\nMissing ' + JETFUEL_FILE + ' configuration file.\n');
                process.exit(ERROR_CONFIG_NOT_FOUND);
            }

        }

        try {

            component.loaded = require(component.require);

        } catch(e) {

            util.error('\nMissing dependency: ' + component + '.\n');
            process.exit(ERROR_DEP_NOT_FOUND);

        }

        util.puts('\nRunning ' + component.name + '...\n');

        on.load && on.load(component.loaded, {
            config: component.config || {},
            args: args || {}
        });
    }

    module.exports = function() {
        return (cli[process.argv[2]] || jetfuel)(args = process.argv.slice(3));
    };

})(undefined);