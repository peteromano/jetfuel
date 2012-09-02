var vows = require('vows'),
	assert = require('assert'),
	espresso = require('espresso-framework');

vows.describe('Version').addBatch({

	'when querying the version': {
		topic: function() {
			return espresso.version();
		},

		'version is 0.1.20': function(topic) {
			assert.equal(topic, '0.1.20');
		}
	} 

}).run();