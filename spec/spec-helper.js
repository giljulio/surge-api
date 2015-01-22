/*var Requester, request;

request = require("request");

Requester = (function() {
    function Requester() {}

    Requester.prototype.get = function(path, callback) {
        return request("http://localhost:3000" + path, callback);
    };

    Requester.prototype.post = function(path, body, callback) {
        return request.post({
            url: "http://localhost:3000" + path,
            body: body
        }, callback);
    };

    return Requester;

})();*/

exports.Strawberry = function () {
    this.color = '#ff0000';
};
exports.Strawberry.prototype = {
    isTasty: function () { return true }
};

exports.Banana = function () {
    this.color = '#fff333';
};
exports.Banana.prototype = {
    peel: function (callback) {
        process.nextTick(function () {
            callback(null, new(exports.PeeledBanana));
        });
    },
    peelSync: function () { return new(exports.PeeledBanana) }
};

exports.PeeledBanana = function () {};