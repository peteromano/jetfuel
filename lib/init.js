(function(undefined) {
    'use strict';

    module.exports = function(project, force) {
        var util = require('util'),
            resolved = require('path').resolve(project),
            done = this.done;

        force = force == '--force';

    	if(!project) { util.puts('Project name is required.'); done(); }
        else if(!force && require('fs').existsSync(project))  { require('util').error('Project path ' + resolved + ' already exists. Use --force to overwrite.'); done(); }
        else require('fs-extra').copy(__dirname + '/../node_modules/jetfuel-boilerplate', resolved, function(error) {
            util.puts('Created project "' + project + '" -> ' + resolved);
            done();
        });

        return this;
    };

})(undefined);