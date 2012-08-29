module.exports = function(grunt) {
    'use strict';

    grunt.registerHelper('minify.closure', function(input, args, callback) {
		var output;
		
		require('closure-compiler').compile(input, args || grunt.config('closure'), function(error, stdout) {
			(output = stdout) && callback && callback(error, stdout);
		});
		
		/*options = options || {};
		args = args || {};
		
		var	cli = ['java', '-jar', options.compilerPath || 'node_modules/closure-compiler/lib/vendor/compiler.jar'];
		
		Object.keys(args).forEach(function(key) {
    		cli.push("--" + key + ' ' + args[key]);
  		});
		
		cli.push('--js_code ' + input);

		grunt.log.writeln(cli.join(' '));
		
		require('child_process').exec(cli.join(' '));*/
		
		return output;
    });

    grunt.registerHelper('minify.uglify', function(input, args, callback) {
		var output = grunt.helper('uglify', input, args || grunt.config('uglify') || {});
		callback && callback(undefined, output);
		return output;
    });
	
};