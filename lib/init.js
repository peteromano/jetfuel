(function(undefined) {
    'use strict';

    module.exports = function(project) {
        require('fs-extra').copy(__dirname + '/../node_modules/jetfuel-boilerplate', require('path').resolve(project), function(error) {
            process.exit(error ? 1 : 0);
        });

        return this;
    };

})(undefined);