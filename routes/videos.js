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


var Video = mongoose.model('Video', {
    title:
    {
        type: String,
        trim: true,
        lowercase: true,
        index: true
    },
    duration:
    {
        type: Number,
         lowercase: true
    },
    ////video_id:
    ////{
    ////    type: String,
    ////    lowercase: true
    ////},
    ////site_id:
    ////{
    ////    type: String,
    ////    trim: true,
    ////    lowercase: true,
    ////    unique: true
    ////},
    url:
    {
        type: String,
        trim: true
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

router.get("/:video_id", function (req, res, next) {
    var query = Video.where({_id: req.params.video_id });
    query.findOne(function (err, video) {
        if(err) {
                next(Boom.notFound("Video not found for this particular ID " + req.params.video_id));
        } else {
            res.send(video);
        }
    });
});

router.post("/", function (req, res, next) {
        console.log(JSON.stringify(req.body) + "\n\n");
        var video = new Video({
            title: req.body.title,
                        url: req.body.url
        });
    video.save(function (err) {
            if (err){
                    next(err);
                } else {
                    res.send("Video has been posted. Thanks");
            }
    });
});

module.exports = router;
