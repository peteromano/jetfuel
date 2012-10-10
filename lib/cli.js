(function(undefined) {
    'use strict';

    var ERROR_CONFIG_NOT_FOUND  = 2,
        ERROR_DEP_NOT_FOUND     = 3,
        ENOENT                  = 'ENOENT',
        DEFAULT_BOWER_COMMAND   = 'help',
        DEFAULT_BOWER_DIR       = 'vendor',
        SRC_FILE                = '_source',
        BOWER_LATEST            = '*',
        GRUNT_FILE              = 'grunt.js',
        JSON_SPACES             = 4,
        JETFUEL_FILE            = '.jetfuel.json';

    var util = require('util'),
        fs = require('fs'),
        path = require('path'),
        readJSON = require('./util').readJSON,
        //info = readJSON(__dirname + '/../package.json'),
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
                util.puts('Version: ' + require('./version').call());
                done();
            },

            init: function() {
                var init = require('./init');
                init.done = done;
                init.apply(init, args);
            },

            grunt:  curry(load, [components.grunt.require]),
            bower:  curry(load, [components.bower.require])

        },

        directives = {

            json: function(file) {
                var data = fs.existsSync(file) && readJSON(file) || {};
                data[SRC_FILE] = file;
                return data;
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
        var config = require(__dirname + '/../node_modules/bower/lib/core/config'),
            vendor = process.jetfuel.bower.vendor,
            dependencies = vendor.dependencies,
            commands = component.commands,
            command = args[0],
            subargs = args.splice(1),
            hooks = {
                install:    curry(writeDependencies),
                uninstall:  curry(writeDependencies, [true])
            };

        function writeDependencies(uninstall) {
            if(!subargs.length) for(var dependency in vendor.dependencies) subargs.push([dependency, vendor.dependencies[dependency] || BOWER_LATEST].join('#'))
            else {
                subargs.forEach(uninstall && removeDependency || addDependency);
                fs.writeFileSync(vendor[SRC_FILE], JSON.stringify(remove(SRC_FILE, require(components.grunt.require).utils._.extend({}, vendor)), null, JSON_SPACES));
            }
        }

        function addDependency(dependency) {
            dependency = dependency.split('#');
            dependencies[dependency[0]] = dependency[1] || BOWER_LATEST;
        }

        function removeDependency(dependency) {
            remove(dependency.split('#')[0], dependencies);
        }

        function remove(k, o) {
            o[k] = undefined;
            delete o[k];
            return o;
        }

        config.directory = vendor.directory || DEFAULT_BOWER_DIR;

        (commands[command] || commands[DEFAULT_BOWER_COMMAND]).apply(component, [subargs])
            .on('end', function() {
                hooks[command] && hooks[command]();
                done();
            })
    }

    function begin(component) {
        running = component;
    }

    function done(code) {
        running = null;
        util.puts('Finished.');
        process.exit(code || 0);
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
        var jwd = path.resolve(path.dirname(require('./util').findup('.', JETFUEL_FILE))),
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