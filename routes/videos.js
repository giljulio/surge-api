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
var util = require('./util');
var models = require('./models');

/**
 * @swagger
 * resourcePath: /videos
 * description: All about API
 */


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

    var query = models.Video.where(filter);
    query.skip(req.query.skip || 0)
        .limit(req.query.limit || 30)
        .sort(sort)
        .select("_id title url category up_vote down_vote surge_rate uploader controversial timestamp")
        .find(function (err, videos) {
        if(err) {
            next(Boom.create(403, "Video not found for this particular ID " + req.params.url, {
                type: "video_id-not-found"
            }));
        } else {
            var response = [];
            videos.forEach(function(video){
                video = video.toObject();
                models.User
                    .where({_id: video.uploader})
                    .select("_id username")
                    .find(function(err, users) {
                    if (err) {
                        next(err);
                    } else {
                        video.uploader = users[0];
                        response.push(video);
                        if (response.length == videos.length) {
                            res.send(response);
                        }
                    }
                });
            });
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
        var video = new models.Video({
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
    var video = new models.Video({
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
    var query = models.Video.where({});
    query.find(function (err, videos) {
        if(!err) {
            console.log("Starting updating surge rate...");
            videos.forEach(function (v) {
                var surge_rating = hotScore(v.up_vote, v.down_vote, v.timestamp);
                v.surge_rate = surge_rating;
                v.controversial = util.calculateControversial([v.up_vote, v.down_vote]);
                v.save();
            });
            console.log("Finished updating surge and controversial values!");
        }
    });
}, 1000 * 60 * 1);

/**
 * @swagger
 * path: /video_id/vote/vote_type/
 * operations:
 *   -  httpMethod: POST
 *      summary: Up or down vote a video
 *      notes: Input a valid video ID and whether you are up or down voting the video (the parameters being "up" or "down" respectively).
 *      nickname: videoVotes
 *      consumes:
 *        - application/json
 *      parameters:
 *        - name: video_id
 *          description: ID of the video
 *          paramType: form
 *          required: true
 *          dataType: string
 *        - name: vote_type
 *          description: Whether they are up or down voting the video
 *          paramType: form
 *          required: true
 *          dataType: string
 */

router.post("/:video_id/vote/:vote_type/", [users.forceAuth, function (req, res, next) {
    var query = models.Video.where({'_id': req.params.video_id});
    query.findOne(function (err, video) {
        if(video) {
            //query = models.Video.where({'_id': req.params.video_id}).where({ $or:[{'up_votes_users': req.user.id},{'down_votes_users': req.user.id}]});
            if (video.down_votes_users.length != video.down_votes_users.pull(req.user.id).length) {
                video.down_votes_users.pull(req.user.id);
                video.down_vote = video.down_vote -1;
                console.log("they've down voted");
                video.save();
            }
            if (video.up_votes_users.length != video.up_votes_users.pull(req.user.id).length) {
                video.up_votes_users.pull(req.user.id);
                video.up_vote = video.up_vote -1;
                console.log("they've up voted");
                video.save();
            }
            if (req.params.vote_type === "up") {
                video.up_vote = video.down_vote + 1;
                video.up_votes_users.push(req.user.id);
            } else {
                video.down_vote = video.down_vote + 1;
                video.down_votes_users.push(req.user.id);
            }
            video.save(function (err) {
                if (err) {
                    next(err);
                }
                else {
                    res.send({
                        response: req.params.vote_type +" vote successful!",
                        upvotes: video.up_vote,
                        downVotes: video.down_vote,
                        type: req.params.vote_type +"-vote-success"
                    });
                }
            });
        } else {
            res.send({"response":"Video Not Found!"});
        }
    });
}]);

module.exports = router;
