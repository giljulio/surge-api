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
    video_id:
    {
        type: String,
        lowercase: true,
        unique: true

    },
    site_id:
    {
        type: String,
        trim: true,
        lowercase: true,
        unique: true
    }
});

router.get("/:video_id", function (req, res, next) {
    var query = Video.where({_id: req.params.video_id });
    query.findOne(function (err, video) {
        if(err) {
            if(err.name == 'CastError'){
                next(Boom.notFound("Video not found for this particular ID " + req.params.video_id));
            }
        } else {
            res.send({
                id: video._id,
                duration: video.duration,
                site_id: video.site_id,
                video_id: video.video_id
            });
        }
    });
});

router.post("/", function (req, res, next) {
        console.log(JSON.stringify(req.body) + "\n\n");
        var video = new Video({
            title: req.body.title,
                duration:req.body.duration,
                    site_id: req.body.site_id,
                        video_id: req.body.video_id
        });
    video.save(function (err) {
            if (err){
                    next(err);
                } else {
                    res.send({
                        title: req.body.title,
                            duration: req.body.duration,
                                siteid: req.body.site_id,
                                    video_id: req.body.video_id
                    });
            }
    });
});

module.exports = router;
