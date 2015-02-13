var crypto = require('crypto');
var base64url = require('base64url');

module.exports = {
    randomStringAsBase64Url: function (size) {
        return base64url(crypto.randomBytes(size));
    },

    createToken: function () {
        return util.randomStringAsBase64Url(40);
    },

    newTimeStamp: function () {
        return new Date().getTime();
    },

    calculateControversial: function(values){
        var avg = util.average(values);

        var squareDiffs = values.map(function(value){
            var diff = value - avg;
            var sqrDiff = diff * diff;
            return sqrDiff;
        });

        var avgSquareDiff = util.average(squareDiffs);

        var stdDev = Math.sqrt(avgSquareDiff);
        if(avg > 10000){
            stdDev += 0.1;
        } else if (avg > 5000){
            stdDev += 0.2;
        } else if (avg > 1000){
            stdDev += 0.3;
        } else if (avg > 500){
            stdDev += 0.4;
        } else if (avg > 100){
            stdDev += 0.5;
        } else if (avg >= 0){
            stdDev += 0.6;
        }
        console.log("Stander dev after: " + stdDev);
        return stdDev;
        },
        average: function (data){
        var sum = data.reduce(function(sum, value){
            return sum + value;
        }, 0);

        var avg = sum / data.length;
        return avg;
    }
}
