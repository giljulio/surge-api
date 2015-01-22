/*describe("App", function() {

    describe("get /", function() {
        it("responds successfully", function() {
            return require('./spec-helper').withServer(function(r, done) {
                return r.get("/", function(err, res, body) {
                    expect(res.statusCode).toEqual(200);
                    return done();
                });
            });
        });
        return it("has the correct body", function() {
            return require('./spec-helper').withServer(function(r, done) {
                return r.get("/", function(err, res, body) {
                    expect(body).toEqual("Hello, world!");
                    return done();
                });
            });
        });
    });
    return describe("post /", function() {
        return it("has the correct body", function() {
            return require('./spec-helper').withServer(function(r, done) {
                return r.post("/", "post body", function(err, res, body) {
                    expect(body).toEqual("You posted!");
                    return done();
                });
            });
        });
    });
});*/


var vows = require('vows'),
    assert = require('assert');

var theGoodThings = require('./spec-helper');

var Strawberry   = theGoodThings.Strawberry,
    Banana       = theGoodThings.Banana,
    PeeledBanana = theGoodThings.PeeledBanana;

vows.describe('The Good Things').addBatch({
    'A strawberry': {
        topic: new(Strawberry),

        'is red': function (strawberry) {
            assert.equal (strawberry.color, '#ff0000');
        },
        'and tasty': function (strawberry) {
            assert.isTrue (strawberry.isTasty());
        }
    },
    'A banana': {
        topic: new(Banana),

        'when peeled *synchronously*': {
            topic: function (banana) {
                return banana.peelSync();
            },
            'returns a `PeeledBanana`': function (result) {
                assert.instanceOf (result, PeeledBanana);
            }
        },
        'when peeled *asynchronously*': {
            topic: function (banana) {
                banana.peel(this.callback);
            },
            'results in a `PeeledBanana`': function (err, result) {
                assert.instanceOf (result, PeeledBanana);
            }
        }
    }
}).export(module); // Export the Suite

