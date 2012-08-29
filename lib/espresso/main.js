module.exports = {

    cli: function() {
        if(process.argv[2] != 'install') this.grunt();
        else this.install();
    },

    grunt: function(force, done) {
        require('grunt').cli({ force: force }, done);
    },

    install: function() {
        var MODULES = 'node_modules',
            FORCE = '--force';

        var fs = require('fs'),
            path = require('path'),
            util = require('util'),
            puts = util.puts,
            args = process.argv.splice(2),
            pwd = process.cwd(),
            cwd = pwd.split('/'),
            projectName = cwd.pop(),
            dirName = cwd.pop(),
            target,
            modules;

        if(dirName == MODULES) {
            try {
                if(fs.existsSync(target = cwd.concat(projectName).join('/'))) puts('\nTarget directory already exists: ' + target);
                else {
                    fs.renameSync(pwd, target);
                    puts('\nMoved project "' + projectName + '" (' + pwd + ') to target: ' + target);

                    process.cwd(target);
                    puts('\nChanged directory: ' + target);

                    if(!fs.readdirSync(modules = path.resolve(target + '/../' + MODULES)).length) {
                        fs.rmdirSync(modules);
                        puts('\nRemoved empty modules directory: ' + modules);
                    }
                }
            } catch(e) {
                util.error('\n' + e + '\n');
                process.exit(1);
            }
        } else {
            puts('\nInstall directory is already the target directory.');
        }

        puts('\nExecuting: ' + ['grunt'].concat(args).join(' ') + '\n');
        this.grunt(args[1] == FORCE, function() {
            puts('\nEspresso installation complete.\n');
        });
    }

};