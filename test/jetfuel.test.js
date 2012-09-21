var vows = require('vows'),
	assert = require('assert'),
	jetfuel = require('../lib/jetfuel');

vows.describe('Jetfuel engine').addBatch({

	'core version': {
		topic: function() {
			return jetfuel.version();
		},

		'is 0.2.0': function(topic) {
			assert.equal(topic, '0.2.0');
		}
	} 

}).run();