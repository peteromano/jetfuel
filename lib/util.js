(function(undefined) {
    'use strict';

    module.exports = {

        readJSON: function(file) {
            return JSON.parse(require('fs').readFileSync(file));
        },

        /*
         * grunt
         * http://gruntjs.com/
         *
         * Copyright (c) 2012 "Cowboy" Ben Alman
         * Licensed under the MIT license.
         * https://github.com/gruntjs/grunt/blob/master/LICENSE-MIT
         *
         * Search for a filename in the given directory or all parent directories.
         */
        findup: function findup(dirpath, filename) {
            // Nodejs libs.
            var path = require('path');
            var fs = require('fs');
            // In Nodejs 0.8.0, existsSync moved from path -> fs.
            var existsSync = fs.existsSync || path.existsSync;

            var filepath = path.join(dirpath, filename);
            // Return file if found.
            if (existsSync(filepath)) { return filepath; }
            // If parentpath is the same as dirpath, we can't go any higher.
            var parentpath = path.resolve(dirpath, '..');
            return parentpath === dirpath ? null : findup(parentpath, filename);
        }

    }

})(undefined);