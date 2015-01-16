var express = require('express');
var router = express.Router();
var async = require("async");
var request = require('request');
var md5 = require('MD5');
var jwt = require('jwt-simple');
var mongoose = require('mongoose');
var Boom = require('boom');


var User = mongoose.model('User', {
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        index: true
    },
    password: String
});

router.get("/:user_id", function (req, res, next) {
    var query = User.where({_id: req.params.user_id });
    query.findOne(function (err, user) {
        if(err) {
            next(err);
        } else if(user == null){
            next(Boom.notFound("User " + req.params.user_id));
        } else {
            res.send(user);
        }
    });
});

router.post("/", function (req, res, next) {
    console.log(JSON.stringify(req.body) + "\n\n");
    var user = new User({
        email: req.body.email,
        password: md5(req.body.password)
    });
    user.save(function (err) {
        if (err){
            next(err);
        } else {
            res.send({
                user_id: user._id,
                email: req.body.email
            });
        }
    });
});

/*
    Creates a user if it doesn't exist. If it does exist it checks if the
    details are valid  If it does it successfully it creates an auth token

*/
/*router.post('/', function (req, res, next) {


    async.waterfall([

        //Checks if the auth token is valid
        function(callback){

            var query = User.where({ email: req.body.email });
            query.findOne(function (err, user) {
                if(err) {
                    callback(err);
                } else if(user == null){
                    //Create a new account as the email isnt already registered
                    callback(null, null);
                } else if(user.password === md5(req.body.password)){
                    //Authenticated!
                    callback(null, {
                        user_id: user._id,
                        user_email: user.email,
                        provider: "basic"
                    });
                } else {
                    callback(new Error("Passwords not matching"));
                }
            });

        },

        //Adds user to db if required
        function(auth, callback){

            if(auth != null){
                callback(null, auth);
            } else {
                var user = new User({
                    email: req.body.email,
                    password: md5(req.body.password)
                });
                user.save(function (err) {
                    if (err){
                        callback(err);
                    } else {
                        callback(null, {
                            user_id: user._id,
                            user_email: req.body.email,
                            provider: "basic"
                        });
                    }
                });
            }

        },

        //Creates JWT token
        function(auth, callback){

            var token = jwt.encode(auth, "GDpe61gaI39giDLhiEGvwmnx68dXJePauHswwehq");

            callback(null, token);
        }
    ], function (err, token) {
        res.send(err ? err : {"token": token})
        next();
    });
});*/

module.exports = router;
