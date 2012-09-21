var vows = require('vows'),
	assert = require('assert'),
	jetfuel = require('../lib/jetfuel');

vows.describe('JetFuel engine').addBatch({

	'core version': {
		topic: function() {
			return jetfuel.version();
		},

		'is 0.2.1': function(topic) {
			assert.equal(topic, '0.2.1');
		}
	} 

}).run();