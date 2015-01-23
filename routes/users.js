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

var expirationTime = 10512000000;


/**
 * @swagger
 * resourcePath: /users
 * description: All about API
 */

var User = mongoose.model('User', {
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        index: true
    },
    password: String,
    token: {
        type:String,
        index:true
    },
    expiration: {
        type:Number
    }
});

function randomStringAsBase64Url(size) {
    return base64url(crypto.randomBytes(size));
}

function createToken() {
    return randomStringAsBase64Url(40);
}

function newTimeStamp() {
    return new Date().getTime();
}

/**
 * @swagger
 * path: /login
 * operations:
 *   -  httpMethod: POST
 *      summary: Login with username and password
 *      notes: Returns a user based on username
 *      responseClass: User
 *      nickname: login
 *      consumes:
 *        - text/html
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
router.get("/:user_id", function (req, res, next) {
    var query = User.where({_id: req.params.user_id });
    query.findOne(function (err, user) {
        if(err) {
            if(err.name == 'CastError'){
                next(Boom.notFound("User not found for id " + req.params.user_id));
            }
        } else {
            res.send(user);
        }
    });
});

router.post("/authenticate", function (req, res, next) {
   var query = User.where('email', req.body.email).where('password', req.body.password);
    query.findOne(function (err, user) {
        if(err) {
            next(Boom.notFound("API Connection Failed"));
        }
        else if (user == null) {
            next(Boom.notFound("Authentication failure for " + req.body.email));
        }
        else {
            var token = createToken();
            var timeStamp = newTimeStamp();
            res.send({token: token, timestamp: timeStamp});
            console.log(user);
            user.token=token;
            user.expiration=timeStamp;
            user.save();
            console.log(user);
        }
    });
});

var checkAuth = exports.checkAuth = function (req, res, next) {
    console.log("checkAuth");
    var token = req.headers.Authorization;
    token.replace("Bearer ", "");
    var query = User.where('token', token);
    query.findOne(function (err, user) {
        if(err) {
            next(Boom.notFound("API Connection Failed"));
        } else if (user == "null") {
            next(Boom.notFound("Token not Found"));
        }
        else {
            if((user.expiration + expirationTime) > newTimeStamp()) {
                console.log("Authentication Successful!");
                next();
            }
            else {
                next(Boom.unauthorized("Token out of date!"));
            }
        }
    });

};

router.get("/:user_id/favs", [checkAuth, function(req, res, next){
    console.log("It authenticated the token!");
    res.send({response: "Success!"});
}]);

/**
 * @swagger
 * path: /
 * operations:
 *   -  httpMethod: GET
 *      summary: Login with username and password
 *      notes: Returns a user based on username
 *      responseClass: User
 *      nickname: login
 *      consumes:
 *        - text/html
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
