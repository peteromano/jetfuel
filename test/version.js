var jetfuel = require('../lib'),
    assert = require('assert');

describe('#version()', function() {
    it('should be at 0.2.x', function() {
        assert.ok(/0.2.\d/.test(jetfuel.version()));
    })
});