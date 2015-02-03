/**
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
    surge_rate:
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
    }
});


/**
 * @swagger
 * path: /video
 * operations:
 *   -  httpMethod: GET
 *      summary: Get backs a list videos
 *      notes: These include Site ID, Duration etc
 *      nickname: Videos
 *      consumes:
 *        - application/json
 *      parameters:
 *        - name: username
 *          description: Your username
 *          paramType: query
 *          required: true
 *          dataType: string
 *        - name: password
 *          description: Your password
 *          paramType: query
 *          required: true
 *          dataType: string
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
                up_vote: -1
            };
        }
        else if(req.query.sort == "controversial"){
            sort = {
            }
        }
    }

    var query = Video.where(filter);
    query.skip(req.query.skip || 0).limit(req.query.limit || 30).sort(sort).find(function (err, video) {
        if(err) {
            next(Boom.notFound("Video not found for this particular ID " + req.params.video_id));
        }
        else
        {
            res.send(video);
        }
    });
});


/**
 * @swagger
 * path: /video
 * operations:
 *   -  httpMethod: GET
 *      summary: Get backs a list videos
 *      notes: These include Site ID, Duration etc
 *      nickname: Videos
 *      consumes:
 *        - application/json
 *      parameters:
 *        - name: username
 *          description: Your username
 *          paramType: query
 *          required: true
 *          dataType: string
 *        - name: password
 *          description: Your password
 *          paramType: query
 *          required: true
 *          dataType: string
 */

router.post("/", function (req, res, next)
        {
        console.log(JSON.stringify(req.body) + "\n\n");
        var video = new Video({
            title: req.body.title,
            url: req.body.url,
            up_vote: req.body.up_vote,
            down_vote: req.body.down_vote,
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

 *      summary: Works out the Surge Rating
 *      notes: It gets the number of up and down votes and then uses the timestamp to work out the rating
 *      notes: Uses decay.js to use the reddit algorithm
 */
setInterval(function () {
    var query = Video.where({});
    query.find(function (err, videos) {
        if(!err) {
            videos.forEach(function (v) {
                console.log(v.down_vote);
                console.log(v.up_vote);
                var surge_rating = hotScore(v.up_vote, v.down_vote, v.timestamp);
                // save so that next GET /entry/ gets an updated ordering
                v.surge_rate = surge_rating;
                v.save();
                console.log(v)
            });
        }
    });
}, 1000 * 60 * 1); // run every 5 minutes, say

module.exports = router;
