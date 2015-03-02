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
 *          dataType: number
 *        - name: sort
 *          description: video sorting
 *          paramType: query
 *          dataType: string
 *        - name: skip
 *          description: offset for videos returned
 *          paramType: query
 *          dataType: number
 *        - name: limit
 *          description: limits how many videos are returned
 *          paramType: query
 *          dataType: number
 */

router.get("/", [users.checkAuth, function (req, res, next) {
    var filter = {};
    if(req.query.category){
        filter = {
            category: req.query.category
        };
    }

    if(req.query.search){
        filter["title"] = new RegExp(".*" + req.query.search + ".*", "i");
    }

    var sort = {};
    if(req.query.sort){
        if(req.query.sort == "surge_rate"){
            sort = {
                surge_rate: -1
            };
        } else if(req.query.sort == "newest"){
            sort = {
                timestamp: -1
            };
        } else if(req.query.sort == "top"){
            sort = {
                up_vote: -1
            };
        } else if(req.query.sort == "controversial"){
            sort = {
                controversial: 1
            };
        } else if(req.query.sort == "featured"){
            sort = {
                timestamp: -1
            };
            filter["featured"] = true;
        }
    }

    var query = models.Video.where(filter);
    query.skip(req.query.skip || 0)
        .limit(req.query.limit || 30)
        .sort(sort)
        .select("_id title url category up_vote down_vote surge_rate uploader featured controversial timestamp user_meta")
        .find(function (err, videos) {
        if(err) {
            next(Boom.create(403, "Video not found for this particular ID " + req.params.url, {
                type: "video_id-not-found"
            }));
        } else {
            if(videos.length == 0){
                res.send([]);
            } else {
                var response = [];
                var count = 0;
                videos.forEach(function (video, index) {
                    /*if(req.user) {
                        if (video.user_meta.watched.indexOf(req.user.id) > -1) {
                            video.user_meta.watched = "true";
                        }
                    }*/
                    video = video.toObject();
                    /*if(video.user_meta.watched == "true") {
                        video.user_meta.watched = {};
                        video.user_meta.watched = "true";
                    } else {
                        video.user_meta.watched = {};
                        video.user_meta.watched = "false";
                    }*/

                    models.User
                        .where({_id: video.uploader})
                        .select("_id username surge_points")
                        .find(function (err, users) {
                            if (err) {
                                next(err);
                            } else {
                                video.uploader = users[0];
                                response[index] = video;
                                count = count + 1;
                                if (count == videos.length) {
                                    res.send(response);
                                }
                            }
                        });
                });
            }
        }
    });
}]);


/**
 * @swagger
 * path: /videos
 * operations:
 *   -  httpMethod: POST
 *      summary: Post a Video
 *      nickname: videoPost
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
        up_vote_users: [],
        down_vote_users: [],
        surge_rate: 0,
        category: req.body.category,
        uploader: req.user.id,
        user_meta: {
            watched : {
                type: [String]
            }
        }
    });
    var valid_url = req.body.url.match(/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/);
    var youtube_url = req.body.url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);

    if (req.body.title.length < 6) {
        next(Boom.create(401, "The title needs to be at least six characters.", {
            type: "invalid-video-title"
        }));
    } else if(youtube_url != null) {
        video.url = youtube_url[1];
        video.save(function (err) {
            if (err) {
                next(err);
            } else {
                res.send(video);
            }
        });
    } else if (valid_url != null) {
        next(Boom.create(401, "The link provided is from a site that is not yet supported.", {
            type: "unsupported-site-url"
        }));
    } else {
        next(Boom.create(401, "The link provided is not valid.", {
            type: "invalid-video-url"
        }));
    }
}]);

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
 * path: /{video_id}/watched/
 * operations:
 *   -  httpMethod: POST
 *      summary:
 *      notes: Input a valid video ID and it will add the user to the list of people that have watched the video. The user must be authenticated.
 *      nickname: videoVotes
 *      consumes:
 *        - application/json
 *      parameters:
 *        - name: video_id
 *          description: ID of the video
 *          paramType: form
 *          required: true
 *          dataType: string
 */


router.post("/:video_id/watched/", [users.forceAuth, function (req, res, next) {
    if(req.params.video_id) {
        var query = models.Video.where({'_id': req.params.video_id});
        query.findOne(function (err, video) {
            if(video) {
                if(video.user_meta.watched.indexOf(req.user.id) > -1) {
                    res.send({message: "video has already watched by user "+ req.user.id, type:"video-already-watched"});
                } else {
                    video.user_meta.watched.push(req.user.id);
                    video.save();
                    res.send({message: "video added to watched list for user "+ req.user.id, type:"video-watched-success"});
                }
            } else {
                next(Boom.create(404, "video not found", {
                    type:"video-not-found"
                }));
            }
        });
    } else {
        next(Boom.create(400, "Incorrect parameters submitted", {
            type: "incorrect-parameters"
        }));
    }
}]);

/**
 * @swagger
 * path: /{video_id}/votes/
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
 *          paramType: body
 *          required: true
 *          dataType: string
 */



router.post("/:video_id/votes/", [users.forceAuth, function (req, res, next) {
    if(req.params.video_id && ((req.body.vote_type === "up")||(req.body.vote_type === "down"))) {
        var query = models.Video.where({'_id': req.params.video_id});
        query.findOne(function (err, video) {
            if(video) {
                var uploaderQuery = models.User.where({'_id': video.uploader}).select("_id username surge_points");
                uploaderQuery.findOne(function (err, uploader) {
                    if (uploader) {
                        if(req.user.id != video.uploader) {
                            if (video.down_votes_users.length != video.down_votes_users.pull(req.user.id).length) {
                                video.down_vote = video.down_vote - 1;
                                uploader.surge_points = uploader.surge_points + 5;
                                uploader.save();
                                video.save();
                            }
                            if (video.up_votes_users.length != video.up_votes_users.pull(req.user.id).length) {
                                video.up_vote = video.up_vote - 1;
                                uploader.surge_points = uploader.surge_points - 10;
                                uploader.save();
                                video.save();
                            }
                            if (req.body.vote_type === "up") {
                                video.up_vote = video.up_vote + 1;
                                uploader.surge_points = uploader.surge_points + 10;
                                video.up_votes_users.push(req.user.id);
                            } else {
                                video.down_vote = video.down_vote + 1;
                                uploader.surge_points = uploader.surge_points - 5;
                                video.down_votes_users.push(req.user.id);
                            }
                            uploader.save();
                            video.save(function (err) {
                                if (err) {
                                    next(err);
                                }
                                else {
                                    var v = video.toObject();
                                    v.uploader = uploader;
                                    res.send(v);
                                }
                            });
                        } else {
                            next(Boom.create(401, "You cannot vote on your own videos", {
                                type: "self-vote-disallowed"
                            }));
                        }
                    } else {
                        next(Boom.create(404, "uploader not found", {
                            type:"uploader-not-found"
                        }));
                    }
                });
                } else {
                    next(Boom.create(404, "video not found", {
                        type:"video-not-found"
                    }));
                }
        });
    } else {
        next(Boom.create(400, "Incorrect parameters submitted", {
            type: "incorrect-parameters"
        }));
    }
}]);

/**
 * @swagger
 * path: /{video_id}/favourites/
 * operations:
 *   -  httpMethod: POST
 *      summary: Favourite or un-favourite a video
 *      notes: Input a valid video ID and the video will be added to the users favourites array or removed if they have already favourited it. The user must be authenticated.
 *      nickname: videoFavourite
 *      consumes:
 *        - application/json
 *      parameters:
 *        - name: video_id
 *          description: ID of the video
 *          paramType: form
 *          required: true
 *          dataType: string
 */

router.post("/:video_id/favourites/", [users.forceAuth, function (req, res, next) {
    if(util.isSet([req.params.video_id])) {
        var query = models.Video.where({'_id': req.params.video_id});
        query.findOne(function (err, video) {
            if (video) {
                var query = models.User.where({_id: req.user.id});
                query.findOne(function (err, user) {
                    if(user) {
                        if (user.favourites.indexOf(req.params.video_id) > -1) {
                            user.favourites.pull(req.params.video_id);
                            user.save();

                            res.send({message: "Video has been un-favourited", type: "video-unfavourite"});
                        } else {
                            user.favourites.push(req.params.video_id);
                            user.save();

                            res.send({message: "Video has been favourited", type: "video-favourite"});
                        }
                    } else {
                        next(Boom.create(404, "user not found", {
                            type:"user-not-found"
                        }));
                    }
                });
            } else {
                next(Boom.create(404, "video not found", {
                    type:"video-not-found"
                }));
            }
        });
    } else {
        next(Boom.create(400, "Incorrect parameters submitted", {
            type: "incorrect-parameters"
        }));
    }
}]);

module.exports = router;
