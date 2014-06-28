module.exports = function (grunt) {
	grunt.initConfig({
		uglify: {
			build: {
				src: 'js/angular-dnd.js',
				dest: 'js/angular-dnd.min.js'
			}
		},
	});
	
	function loadNpmTasks(tasks) {
		tasks.forEach(function (task, i) {
			grunt.loadNpmTasks(task);
		});
	}

	loadNpmTasks([
		'grunt-contrib-uglify',
	]);

	grunt.registerTask('default', [
		'uglify',
	]);
};