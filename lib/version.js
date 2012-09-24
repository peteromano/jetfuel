(function(undefined) {
    'use strict';

    module.exports = function() {
        return require('grunt').file.readJSON(__dirname + '/../package.json').version;
    };

})(undefined);