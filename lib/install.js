(function(undefined) {
    'use strict';

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
                'JetFuel Engine v' + require('./version').call(),
                '=====================\n',
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
        fs.mkdirSync('.jetfuel');
        fs.mkdirSync('.jetfuel/logs');
    }

    function writeLog() {
        fs.writeFileSync('.jetfuel/logs/' + INSTALL_LOG, report.join('\n'));
    }

    module.exports = function(force) {
        if(dirName != MODULES) puts('\nProject already installed. Use ./jetfuel init to run configuration shell, or ./jetfuel install --force to re-run installation.\n');
        else try {
            if(fs.existsSync(target = cwd.concat(projectName).join('/'))) puts('\nTarget directory already exists: ' + target + '\n');
            else {
                createProjectDirectories();

                fs.renameSync(pwd, target);
                puts('\nMoved project "' + projectName + '" (' + pwd + ') to target: ' + target);

                process.cwd(target);
                puts('\nChanged directory: ' + target);

                if(!fs.readdirSync(modules = require('path').resolve(target + '/../' + MODULES)).length) {
                    fs.rmdirSync(modules);
                    puts('\nRemoved empty modules directory: ' + modules);
                }

                puts('\nJetFuel installation complete.\n');

                writeLog();
            }
        } catch(e) {
            try { createProjectDirectories(); } catch(e) {}
            util.error(log('\n' + e + '\n'));
            writeLog();
            code = 1;
        }

        process.exit(code);
    };

})(undefined);