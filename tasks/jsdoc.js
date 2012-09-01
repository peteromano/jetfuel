module.exports = function(grunt) {
    'use strict';

    var JSDOC_APP_DIR = 'app',
        MODULES = 'node_modules';

    grunt.registerMultiTask('jsdoc', 'JSDocs for src, outputted to dest.', function() {
    	var path = require('path'),
            jsdoc = this.data,
    		src = path.resolve(this.file.src),
    		dest = path.resolve(this.file.dest),
            toolkitDir = path.dirname(module.filename) + '/../' + MODULES + '/jsdoc-toolkit',
            t = path.resolve(jsdoc.t || toolkitDir + '/templates/jsdoc'),
            p = path.resolve(jsdoc.path || toolkitDir),
            cli = [
                path.resolve(toolkitDir + '/' + JSDOC_APP_DIR) + '/' + (jsdoc.app || 'run.js'),
                src,
                '-d='+dest,
                '-t='+t,
                jsdoc.a ? '-a' : '',
                jsdoc.p ? '-p' : '',
                jsdoc.r ? '-r=' + jsdoc.r : '',
                jsdoc.E ? '-E=' + jsdoc.E : ''
            ].join(' ');
        try {
            grunt.helper('process.pushd', p);
            grunt.log.writeln('exec: ' + cli);
            require('child_process').exec(cli);
            grunt.helper('process.popd');
        } catch(e) {
            grunt.log.writeln(e);
            return false;
        }
    });

};