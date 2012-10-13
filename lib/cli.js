(function(undefined) {
    'use strict';

    var ERROR_CONFIG_NOT_FOUND  = 2,
        ERROR_DEP_NOT_FOUND     = 3,
        JSON_SPACES             = 2,
        ENOENT                  = 'ENOENT',
        SRC_FILE                = '_source',
        GRUNT_FILE              = 'grunt.js',
        JAM_DEFUALT_DIR         = 'vendor',
        JETFUEL_FILE            = '.jetfuel.json';

    var util = require('util'),
        fs = require('fs'),
        path = require('path'),
        color = require('colors'),
        readJSON = require('./util').readJSON,
        info = readJSON(__dirname + '/../package.json'),
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

            jamjs: {
                name: 'Jam',
                loaded: null,
                require: 'jamjs',
                onLoad: jam
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

            grunt:      curry(load, [components.grunt.require]),
            jam:        curry(load, [components.jamjs.require]),
            install:    curry(load, [components.jamjs.require, { command: 'install' }]),
            uninstall:  curry(load, [components.jamjs.require, { command: 'remove' }]),
            remove:     curry(load, [components.jamjs.require, { command: 'remove' }]),
            upgrade:    curry(load, [components.jamjs.require, { command: 'upgrade' }]),
            list:       curry(load, [components.jamjs.require, { command: 'ls' }]),
            ls:         curry(load, [components.jamjs.require, { command: 'ls' }])

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

    function jam(component, options) {
        options.args.command && args.unshift(options.args.command);

        var config = process.jetfuel.config.jam,
            //commands = require(__dirname + '/../node_modules/jamjs/lib/commands'),
            dependencies = config.dependencies,
            command = args[0],
            subargs = args.splice(1),
            hooks = {
                install:    curry(writeDependencies),
                remove:     curry(writeDependencies, [true]),
                upgrade:    writePackageJSON
            },

            jam;

        function writeDependencies(uninstall) {
            subargs.forEach(uninstall && removeDependency || addDependency);
            writeJSON(config[SRC_FILE], remove(SRC_FILE, require(components.grunt.require).utils._.extend({}, config)));
            writePackageJSON();
        }

        function addDependency(dependency) {
            dependency = dependency.split('@');
            dependencies[dependency[0]] = dependency[1] || '*';
        }

        function removeDependency(dependency) {
            remove(dependency.split('@')[0], dependencies);
        }

        function remove(k, o) {
            o[k] = undefined;
            delete o[k];
            return o;
        }

        function writeJSON(file, data) {
            fs.writeFileSync(file, JSON.stringify(data, null, JSON_SPACES));
        }

        function writePackageJSON() {
            var jam = info.jam = info.jam || {};
            jam.packageDir = config.dest || JAM_DEFUALT_DIR;
            jam.dependencies = config.dependencies || {};
            writeJSON('package.json', info);
        }

        function hook() {
            hooks[command] && hooks[command]();
        }

        writePackageJSON();

        if(command == 'upgrade') hook();

        args = [__dirname + '/../node_modules/jamjs/bin/jam'].concat(args).concat(subargs);

        jam = require('child_process').spawn('node', args, { stdio: [process.stdin, 'pipe', 'pipe'] })
                .on('exit', function(code) {
                    if(!code) hook();
                    done();
                });

        jam.stdout.on('data', process.stdout.write);
        jam.stderr.on('data', process.stderr.write);
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
                    FILE: JETFUEL_FILE,
                    EXEC: process.argv[1]
                }
            },

            jConfig, cmpConfig;

        process.chdir(jwd);

        if(!fs.existsSync(JETFUEL_FILE)) {
            util.error('Missing ' + JETFUEL_FILE + ' project configuration file.');
            done(ERROR_CONFIG_NOT_FOUND);
        }

        for(var cmp in (jConfig = jetfuel.config = readJSON(JETFUEL_FILE))) {
            if(typeof (jConfig[cmp] = directive(jConfig[cmp])) === 'object') {
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

        util.puts('Running ' + component.name.bold + '...');

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