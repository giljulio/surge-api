/*
 * Created by qasimshabir on 23/01/15.
 */
var express = require('express');
var router = express.Router();
var async = require("async");
var request = require('request');
var md5 = require('MD5');
var jwt = require('jwt-simple');
var mongoose = require('mongoose');
var Boom = require('boom');
var crypto = require('crypto');
var base64url = require('base64url');
var decay = require('decay'), hotScore = decay.redditHot();
var users = require('./users');

/**
 * @swagger
 * resourcePath: /videos
 * description: All about API
 */
var Video = mongoose.model('Video', {

    title:
    {
        type: String,
        trim: true,
        index: true,
        required: true
    },
    up_vote:
    {
        type:Number,
        required: true
    },
    down_vote:
    {
        type:Number,
        required: true
    },
    up_votes_users:
    {
        type: [String]
    },
    down_votes_users:
    {
        type: [String]
    },
    surge_rate:
    {
        type:Number
    },
    controversial:
    {
        type:Number
    },
    url:
    {
        type: String,
        trim: true,
        required: true
    },
    timestamp:
    {
        type: Date,
        default: Date.now
    },
    category:
    {
        type:Number,
        required:true
    },
    uploader: {
        type: String,
        required: true
    }
});


/**
 * @swagger
 * path: /videos
 * operations:
 *   -  httpMethod: GET
 *      summary: Get backs a list videos
 *      notes: These include category, sort, skip, limit
 *      nickname: Videos
 *      consumes:
 *        - application/json
 *      parameters:
 *        - name: category
 *          description: video category
 *          paramType: query
 *          required: true
 *          dataType: number
 *        - name: sort
 *          description: video sorting
 *          paramType: query
 *          required: true
 *          dataType: string
 *        - name: skip
 *          description: offset for videos returned
 *          paramType: query
 *          required: true
 *          dataType: number
 *        - name: limit
 *          description: limits how many videos are returned
 *          paramType: query
 *          required: true
 *          dataType: number
 */

router.get("/", function (req, res, next)
{
    var filter = {};
    if(req.query.category){
        filter = {
            category: req.query.category
        };
    }

    var sort = {};
    if(req.query.sort){
        if(req.query.sort == "surge_rate"){
            sort = {
                surge_rate: -1
            };
        }
        else if(req.query.sort == "newest"){
            sort = {
                timestamp: -1
            };
        }
        else if(req.query.sort == "top"){
            sort = {
                top: -1
            };
        }
        else if(req.query.sort == "controversial"){
            sort = {
                controversial: +1
            }
        }
    }

    var query = Video.where(filter);
    query.skip(req.query.skip || 0)
        .limit(req.query.limit || 30)
        .sort(sort)
        .find(function (err, videos) {
        if(err) {
            next(Boom.create(403, "Video not found for this particular ID " + req.params.url, {
                type: "video_id-not-found"
            }));
        } else {
            // Need to select what fields to return - do not want to return up_votes_users/down_votes_users arrays
            res.send(videos);
        }
    });
});


/**
 * @swagger
 * path: /videos
 * operations:
 *   -  httpMethod: POST
 *      summary: Post a Video
 *      notes: These include title, url, category
 *      nickname: Videos
 *      consumes:
 *        - application/json
 *      parameters:
 *        - name: title
 *          description: video title
 *          paramType: form
 *          required: true
 *          dataType: string
 *        - name: url
 *          description: video url
 *          paramType: form
 *          required: true
 *          dataType: string
 *        - name: category
 *          description: video category
 *          paramType: form
 *          required: true
 *          dataType: number
 */
router.post("/", [users.forceAuth, function (req, res, next) {
        console.log(JSON.stringify(req.body) + "\n\n");
        console.log("userid: " + req.user.id);
        var video = new Video({
            title: req.body.title,
            url: req.body.url,
            up_vote: 0,
            down_vote: 0,
            up_vote_users: [],
            down_vote_users: [],
            surge_rate: req.body.surge_rate,
            category: req.body.category,
            uploader: req.user.id
        });
        if (req.body.title.length < 6) {
            next(Boom.create(401, "The title needs to be at least six characters.", {
                type: "invalid-video-title"
            }));
        } else {
            video.save(function (err) {
                if (err) {
                    next(err);
                } else {
                    res.send(video);
                }
            });
        }
}]);

router.post("/vote", function (req, res, next) {
    console.log(JSON.stringify(req.body) + "\n\n");
    var video = new Video({
        title: req.body.title,
        url: req.body.url,
        up_vote: 0,
        down_vote: 0,
        surge_rate: req.body.surge_rate,
        category: req.body.category
    });
    if (req.body.title.length < 6) {
        next(Boom.unauthorized("The title needs to be at least six characters."));
    } else {
        video.save(function (err) {
            if (err) {
                next(err);
            } else {
                res.send(video);
            }
        });
    }
});

/**
 * @swagger
 *      summary Works out the Surge Rating and controversial
 *      notes It gets the number of up and down votes and then uses the timestamp to work out the rating
 *      notes Uses decay.js to use the reddit algorithm
 *      notes works out a number for controversial
 *      notes this is calculated using standard deviation
 *      notes slight change implemented to make the score more reliable
 */

setInterval(function () {
    var query = Video.where({});
    query.find(function (err, videos) {
        if(!err) {
            console.log("Starting updating surge rate...");
            videos.forEach(function (v) {
                var surge_rating = hotScore(v.up_vote, v.down_vote, v.timestamp);
                v.surge_rate = surge_rating;
                v.uploader = "54bd15dba497a08a771d05fc";
                v.controversial = standardDeviation([v.up_vote, v.down_vote]);
                v.save();
            });
            console.log("Finished updating surge and controversial values!");
        }
    });
}, 1000 * 60 * 1);


/*
 *      summary: works out standard deviation
 *      notes: returns a value which then gets assigned to the controversial field in the monogodb model
 */
function standardDeviation(values){

    var avg = average(values);

    var squareDiffs = values.map(function(value){
        var diff = value - avg;
        var sqrDiff = diff * diff;

        return sqrDiff;
    });

    var avgSquareDiff = average(squareDiffs);

    var stdDev = Math.sqrt(avgSquareDiff);

    if (avg > 1000) {
        stdDev += 1;
    } else if (avg > 100){
        stdDev += 2;
    } else if (avg >= 0){
        stdDev += 3;
    }
    return stdDev;
}

function average(data){
    var sum = data.reduce(function(sum, value){
        return sum + value;
    }, 0);

    var avg = sum / data.length;
    return avg;
}

module.exports = router;
