(function(undefined) {
    'use strict';

    var INIT = 'Init: ';

    module.exports = function(project, force) {
        var util = require('util'),
            resolved = require('path').resolve(project),
            fs = require('fs-extra'),
            done = this.done;

        force = force == '--force';

    	if(!project) { util.error(INIT + 'Project name is required.'); done(1); }
        else if(!force && require('fs').existsSync(project))  { util.error(INIT + 'Project path ' + resolved.bold + ' already exists. Use ' + '--force'.bold + ' to overwrite.'); done(1); }
        else {
            //fs.remove(resolved);
            fs.copy(__dirname + '/../node_modules/jetfuel-blackbox', resolved, function(error) {
                util.puts(INIT + 'Created project "' + project.bold + '" at ' + resolved.bold);
                done();
            });
        }

        return this;
    };

})(undefined);
