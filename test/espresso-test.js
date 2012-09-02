var vows = require('vows'),
	assert = require('assert'),
	espresso = require('../lib/espresso');

vows.describe('Version').addBatch({

	'when querying the version': {
		topic: function() {
			return espresso.version();
		},

		'version is 0.1.21': function(topic) {
			assert.equal(topic, '0.1.21');
		}
	} 

}).run();