(function(undefined) {
    'use strict';

    var ERROR_CONFIG_NOT_FOUND  = 2,
        ERROR_DEP_NOT_FOUND     = 3,
        DEFAULT_BOWER_COMMAND   = 'help',
        GRUNT_FILE              = 'grunt.js',
        JETFUEL_FILE            = '.jetfuel.json',
        ENOENT                  = 'ENOENT';

    var util = require('util'),
        readJSON = require('./util').readJSON,
        directories = [],
        args,

        components = {

            grunt: {
                name: 'Grunt',
                loaded: null,
                require: 'grunt',
                onLoad: grunt,
                config: {
                    npmTasks: ['jetfuel-grunt-tasks']
                }
            },

            bower: {
                name: 'Bower',
                loaded: null,
                require: 'bower',
                onLoad: bower
            }

        },

        cli = {

            "--version": function() {
                util.puts(['\nJetFuel version', require('./version').call() + '\n'].join(' '));
            },

            init: function() {
                var init = require('./init');
                init.apply(init, args);
            },

            grunt:  curry(load, [components.grunt.require]),
            bower:  curry(load, [components.bower.require])

        },

        directives = {

            json: function(file) {
                return readJSON(file);
            }

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

    function directive(value) {
        var parts = typeof value === 'string' && value.match(/^<(.*)>$/),
            directive = parts && (parts = parts[1].split(':')) && directives[parts[0]];

        return directive && directive.apply(this, parts.shift() && parts) || value;
    }

    function bower(component, options) {
        var commands = component.commands;
        (commands[args[0]] || commands[DEFAULT_BOWER_COMMAND]).apply(component, [args.splice(1)]);
    }

    function grunt(component, options) {
        !options.args.facade && component.cli.tasks.shift();

        pushd(__dirname + '/..');

        options.config.npmTasks.forEach(function(task) {
            component.loadNpmTasks(task);
        });

        popd();

        component.cli({ config: __dirname + '/' + GRUNT_FILE });
    }

    function configure() {
        var path = require('path'),
            jwd = path.resolve(path.dirname(require('./util').findup('.', JETFUEL_FILE))),
            jetfuel, config;

        try {

            process.chdir(jwd);

            for(var cmp in (jetfuel = process.jetfuel = readJSON(JETFUEL_FILE))) {
                if(typeof jetfuel[cmp] === 'object') {
                    for(var value in (config = jetfuel[cmp])) {
                        config[value] = directive(config[value]);
                    }
                }

            }

            jetfuel.PATH = jwd;
            jetfuel.FILE = JETFUEL_FILE;

        } catch(e) {

            if(e.code != ENOENT) throw e;
            else {
                util.error('\nMissing ' + JETFUEL_FILE + ' configuration file.\n');
                process.exit(ERROR_CONFIG_NOT_FOUND);
            }

        }
    }

    function load(component, args) {
        component = components[component];

        configure();

        try {

            component.loaded = require(component.require);

        } catch(e) {

            util.error('\nMissing dependency: ' + component + '.\n');
            process.exit(ERROR_DEP_NOT_FOUND);

        }

        util.puts('\nRunning ' + component.name + '...\n');

        component.onLoad && component.onLoad(component.loaded, {
            config: component.config || {},
            args: args || {}
        });
    }

    module.exports = function() {
        return (cli[process.argv[2]] || jetfuel)(args = process.argv.slice(3));
    };

})(undefined);