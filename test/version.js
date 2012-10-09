var jetfuel = require('../lib'),
    assert = require('assert');

describe('#version()', function() {
    it('should be at 1.0.0pre-x', function() {
        assert.ok(/1.0.0pre-\d/.test(jetfuel.version()));
    })
});