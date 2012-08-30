module.exports = {

    cli: function() {
        return (this[process.argv[2]] || this.grunt).apply(this, arguments);
    },

    grunt: function(force, done) {
        require('grunt').cli({ force: force }, done);
        return this;
    },

    install: function() {
        var MODULES = 'node_modules';

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

        //puts('\nExecuting: ' + ['grunt'].concat(args).join(' ') + '\n');

        //return this.grunt(args[1] == '--force', function() {
            if(dirName != MODULES) puts('\nInstall directory is already the target directory.');
            else try {
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

            puts('\nEspresso installation complete.\n');

	    return this;
        //});
    }

};
