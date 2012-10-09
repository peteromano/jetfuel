(function(undefined) {
    'use strict';

    var ERROR_CONFIG_NOT_FOUND  = 2,
        ERROR_DEP_NOT_FOUND     = 3,
        ENOENT                  = 'ENOENT',
        DEFAULT_BOWER_COMMAND   = 'help',
        GRUNT_FILE              = 'grunt.js',
        JETFUEL_FILE            = '.jetfuel.json';

    var util = require('util'),
        fs = require('fs'),
        readJSON = require('./util').readJSON,
        info = readJSON(__dirname + '/../package.json'),
        directories = [],
        running = null,
        args,

        LogEnum = {
            INFO:       'INFO',
            ERROR:      'ERROR',
            DEBUG:      'DEBUG',
            WARNING:    'WARNING'
        },

        components = {

            grunt: {
                name: 'Grunt',
                loaded: null,
                require: 'grunt',
                onLoad: grunt,
                onComplete: done,
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
                util.puts('Version ' + require('./version').call());
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
                return fs.existsSync(file) && readJSON(file) || {};
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

    function msg(str, type) {
        return '[' + (LogEnum[type] || LogEnum.INFO) + '] ' + (running && running.name + ': ' || '') + str;
    }

    function errorMsg(str) {
        return msg(str, LogEnum.ERROR);
    }

    function bower(component, options) {
        var commands = component.commands;
        (commands[args[0]] || commands[DEFAULT_BOWER_COMMAND]).apply(component, [args.splice(1)]);
    }

    function begin(component) {
        running = component;
    }

    function done(code) {
        running = null;
        util.puts('Done!');
        process.exit(code);
    }

    function setLogging() {
        var write = process.stdout.write.bind(process.stdout),
            error = process.stderr.write.bind(process.stderr);

        process.stdout.write = function(str, component, type) { return write(msg(str, component, type)); };
        process.stderr.write = function(str, component) { return error(errorMsg(str, component)); };
    }

    function grunt(component, options) {
        !options.args.facade && component.cli.tasks.shift();

        pushd(__dirname + '/..');

        options.config.npmTasks.forEach(function(task) {
            component.loadNpmTasks(task);
        });

        popd();

        component.cli({ config: __dirname + '/' + GRUNT_FILE }, options.done);
    }

    function setup() {
        var path = require('path'),
            jwd = path.resolve(path.dirname(require('./util').findup('.', JETFUEL_FILE))),
            jetfuel, config;

        process.chdir(jwd);

        if(!fs.existsSync(JETFUEL_FILE)) {
            util.error('Missing ' + JETFUEL_FILE + ' project configuration file.');
            process.exit(ERROR_CONFIG_NOT_FOUND);
        } else {
            jetfuel = process.jetfuel = readJSON(JETFUEL_FILE);
            jetfuel.PATH = jwd;
            jetfuel.FILE = JETFUEL_FILE;
        }

        for(var cmp in jetfuel) {
            if(typeof jetfuel[cmp] === 'object') {
                for(var value in (config = jetfuel[cmp])) {
                    config[value] = directive(config[value]);
                }
            }

        }
    }

    function load(component, args) {
        component = components[component];

        setup();

        try {

            component.loaded = require(component.require);

        } catch(e) {

            util.error(e);
            process.exit(ERROR_DEP_NOT_FOUND);

        }

        util.puts('Running ' + component.name + '...');

        begin(component);

        component.onLoad && component.onLoad(component.loaded, {
            done: component.onComplete,
            name: component.name,
            config: component.config || {},
            args: args || {}
        });
    }

    module.exports = function() {
        setLogging();
        return (cli[process.argv[2]] || jetfuel)(args = process.argv.slice(3));
    };

})(undefined);