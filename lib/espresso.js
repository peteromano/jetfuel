module.exports = {

    cli: function() {
        return (this[process.argv[2]] || this.grunt).apply(this, arguments);
    },

    grunt: function(force, done) {
        require('grunt').cli({ force: force }, done);
        return this;
    },

    install: function() {
        var MODULES = 'node_modules',
            INSTALL_LOG = 'INSTALL.md',

            fs = require('fs'),
            path = require('path'),
            util = require('util'),
            args = process.argv.splice(2),
            pwd = process.cwd(),
            cwd = pwd.split('/'),
            projectName = cwd.pop(),
            dirName = cwd.pop(),
            
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

        if(dirName != MODULES) puts('\nProject already installed. Use ./espresso config -i to run configuration shell, or ./espresso install --force to re-run installation.\n');
        else {
            fs.mkdirSync('.espresso');
            fs.mkdirSync('.espresso/logs');

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

                    puts('\nEspresso installation complete.\n');

                    fs.writeFileSync('.espresso/logs/' + INSTALL_LOG, report.join('\n'));
                }
            } catch(e) {
                util.error(log('\n' + e + '\n'));
                process.exit(1);
            }
        }

        return this;
    }

};
