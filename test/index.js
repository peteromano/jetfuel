var jetfuel = require('../lib'),
    assert = require('assert');

describe('jetfuel.engine.core', function() {

    describe('#version()', function() {
        it('should be at 0.2.x', function() {
            assert.equal(jetfuel.version(), jetfuel.version());
        })
    });

});