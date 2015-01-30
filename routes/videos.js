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
var decay = require('decay')
    , hotScore = decay.redditHot();

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
    var query = Video.where({});
    query.find(function (err, video) {
        if(err)
        {
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
            url: req.body.url

        });
        if (req.body.title.length < 6) {
            next(Boom.unauthorized("The title needs to be at least six characters."));
        } else {
            video.save(function (err) {
                if (err) {
                    next(err);
                } else {
                    res.send({
                        message: "Video has been posted. Thanks"
                    });
                }
            });
        }
});


setInterval(function () {
    var query = Video.where({});
    query.find(function (err, videos) {
        if(!err) {
            videos.forEach(function (v) {
                var surge_rating = hotScore(v.ups, v.downs, v.timestamp);
                // save so that next GET /entry/ gets an updated ordering
                videos.surge_rate.push(surge_rating)
                videos.save();
                console.log(videos)
            });
        }
    });
}, 1000 * 60 * 5); // run every 5 minutes, say

module.exports = router;
