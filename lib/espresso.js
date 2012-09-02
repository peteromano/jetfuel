module.exports = (function(global, undefined) {
    var path = require('path'),
        grunt = require('grunt'),
        moddir = path.dirname(module.filename) + '/..',
        info = grunt.file.readJSON(moddir + '/package.json'),
        cli = {

            "--version": function() {
                grunt.log.writeln(['Espresso version', this.version()].join(' '));
            },

            init: function() {},

            install: function() {
                var MODULES = 'node_modules',
                    INSTALL_LOG = 'INSTALL.md',

                    fs = require('fs'),
                    util = require('util'),
                    pwd = process.cwd(),
                    cwd = pwd.split('/'),
                    projectName = cwd.pop(),
                    dirName = cwd.pop(),
                    code = 0,
                    
                    target, modules,

                    report = [
                            'Espresso "DoubleShot" JavaScript Framework',
                            '==========================================\n',
                            'PROJECT INSTALLATION LOG',
                            '(' + new Date + ')',
                            '------------------------'
                        ];

                function log(output) {
                    report.push((output || '').replace(/^\n/, '* '));
                    return output;
                }

                function puts(output) {
                    log(output);
                    return util.puts.apply(util, arguments);
                }

                function createProjectDirectories() {
                    fs.mkdirSync('.espresso');
                    fs.mkdirSync('.espresso/logs');
                }

                function writeLog() {
                    fs.writeFileSync('.espresso/logs/' + INSTALL_LOG, report.join('\n'));
                }

                if(dirName != MODULES) puts('\nProject already installed. Use ./espresso init to run configuration shell, or ./espresso install --force to re-run installation.\n');
                else try {
                    if(fs.existsSync(target = cwd.concat(projectName).join('/'))) puts('\nTarget directory already exists: ' + target + '\n');
                    else {
                        createProjectDirectories();

                        fs.renameSync(pwd, target);
                        puts('\nMoved project "' + projectName + '" (' + pwd + ') to target: ' + target);

                        process.cwd(target);
                        puts('\nChanged directory: ' + target);

                        if(!fs.readdirSync(modules = path.resolve(target + '/../' + MODULES)).length) {
                            fs.rmdirSync(modules);
                            puts('\nRemoved empty modules directory: ' + modules);
                        }

                        puts('\nEspresso installation complete.\n');
                        
                        writeLog();
                    }
                } catch(e) {
                    try { createProjectDirectories(); } catch(e) {}
                    util.error(log('\n' + e + '\n'));
                    writeLog();
                    code = 1;
                }

                process.exit(code);
            }

        };

    function loadGruntTask(force, done) {
        loadEspressoTasks();
        grunt.cli({ force: force }, done);
    }

    function loadEspressoTasks() {
        var pwd = process.cwd();
        grunt.loadNpmTasks('espresso-framework');
        process.chdir(moddir);
        grunt.loadNpmTasks('grunt-jasmine-task');
        process.chdir(pwd);
    }

    return {

        cli: function() {
            return (cli[process.argv[2]] || loadGruntTask).apply(this, arguments);
        },

        version: function() {
            return info.version;
        }   

    };

})(this, undefined);