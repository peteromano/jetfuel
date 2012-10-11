(function(undefined) {
    'use strict';

    var ERROR_CONFIG_NOT_FOUND  = 2,
        ERROR_DEP_NOT_FOUND     = 3,
        JSON_SPACES             = 4,
        ENOENT                  = 'ENOENT',
        DEFAULT_BOWER_COMMAND   = 'help',
        DEFAULT_BOWER_DIR       = 'vendor',
        SRC_FILE                = '_source',
        GRUNT_FILE              = 'grunt.js',
        JETFUEL_FILE            = '.jetfuel.json',
        BOWER_LATEST            = '*';

    var util = require('util'),
        fs = require('fs'),
        path = require('path'),
        color = require('colors'),
        readJSON = require('./util').readJSON,
        //info = readJSON(__dirname + '/../package.json'),
        directories = [],
        die = curry(done, [1]),
        running = null,
        args,

        IndicatorsEnum = {
            SUCCESS:    '✓',
            FAILURE:    '✕'
        },

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
                util.puts('Version: ' + require('./version').call().bold);
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
        return msg(str, LogEnum.ERROR).red;
    }

    function bower(component, options) {
        var config = require(__dirname + '/../node_modules/bower/lib/core/config'),
            vendor = process.jetfuel.config.bower.vendor,
            dependencies = vendor.dependencies,
            commands = component.commands,
            command = args[0],
            subargs = args.splice(1),
            nowrite = false,
            hooks = {
                install:    curry(writeDependencies),
                uninstall:  curry(writeDependencies, [true])
            };

        function writeDependencies(uninstall) {
            if(nowrite) return;
            subargs.forEach(uninstall && removeDependency || addDependency);
            fs.writeFileSync(vendor[SRC_FILE], JSON.stringify(remove(SRC_FILE, require(components.grunt.require).utils._.extend({}, vendor)), null, JSON_SPACES));
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

        function log(data, type) { data && util[type == LogEnum.ERROR ? 'error' : 'puts'](data); }

        config.directory = vendor.directory || DEFAULT_BOWER_DIR;

        if(command == 'uninstall') hooks[command] && hooks[command]();
        else if(command == 'install' && !subargs.length) {
            for(var dependency in vendor.dependencies) {
                subargs.push([dependency, vendor.dependencies[dependency] || BOWER_LATEST].join('#'));
                nowrite = true;
            }
        }

        try {
            (commands[command] || commands[DEFAULT_BOWER_COMMAND]).apply(component, [subargs, {}])
                .on('data',  log)
                .on('end', function(data) {
                    hooks[command] && hooks[command]();
                    log(data);
                    done();
                })
                .on('error', function(data) {
                    log(data, LogEnum.ERROR);
                    die();
                });
        } catch(e) {
            util.error(e);
            die();
        }
    }

    function begin(component) {
        running = component;
    }

    function done(code) {
        code = code || 0;
        running = null;
        if(code === 0) util.puts(IndicatorsEnum.SUCCESS.green + ' Done.');
        else util.error(IndicatorsEnum.FAILURE + ' Done.');
        process.exit(code);
    }

    function setLogging() {
        var write = process.stdout.write.bind(process.stdout),
            error = process.stderr.write.bind(process.stderr);

        process.stdout.write = function(str) { return write(msg(str)); };
        process.stderr.write = function(str) { return error(errorMsg(str)); };
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
            jetfuel = process.jetfuel = process.jetfuel || {
                config: {},
                components: {},
                env: {
                    PATH: jwd,
                    FILE: JETFUEL_FILE
                }
            },

            jConfig, cmpConfig;

        process.chdir(jwd);

        if(!fs.existsSync(JETFUEL_FILE)) {
            util.error('Missing ' + JETFUEL_FILE + ' project configuration file.');
            done(ERROR_CONFIG_NOT_FOUND);
        }

        for(var cmp in (jConfig = jetfuel.config = readJSON(JETFUEL_FILE))) {
            if(typeof jConfig[cmp] === 'object') {
                for(var value in (cmpConfig = jConfig[cmp])) {
                    cmpConfig[value] = directive(cmpConfig[value]);
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