module.exports = function(grunt) {
    'use strict';

  grunt.registerMultiTask('godmin', 'Uglify all files.', function() {
        var filepaths = grunt.file.expandFiles(this.file.src),
            banner = grunt.task.directive(this.data.banner) || '',
            dest = this.file.dest,
			helper = this.data.helper,
			args = this.data.args,
			data = this.data,
            extension = this.data.extension || '.min.js',
            replace = this.data.replace || '.js',
            verbose = this.data.verbose,
            task = this,
            errorCount;

        try {

            filepaths.forEach(function(filepath) {
                var newFile;

				grunt.helper(helper, grunt.file.read(filepath), args, function(error, output) {
					grunt.file.write(
						newFile = grunt.helper('path.to_dest_path', filepath, dest).replace(replace, extension),
						banner + output
					);

					errorCount |= task.errorCount;
	
					verbose && grunt.log.writeln('File "' + newFile + '" created.');
				});
            });

        } catch(e) {

            grunt.log.writeln(e);
            return false;

        }

        if (errorCount) return false;
    });

};