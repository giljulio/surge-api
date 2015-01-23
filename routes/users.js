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
    password: String
});

var Token = mongoose.model('Token', {
   user_id: {
       type: String,
       index:true
   },
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
 * path: /user/userID
 * operations:
 *   -  httpMethod: GET
 *      summary: Get user ID's
 *      notes: Returns a list of User ID
 *      nickname: User details
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
router.get("/:user_id", function (req, res, next) {
    var query = User.where({_id: req.params.user_id });
    query.findOne(function (err, user) {
        if(err) {
            if(err.name == 'CastError'){
                next(Boom.notFound("User not found for id " + req.params.user_id));
            }
        } else {
            res.send({id:user._id, email:user.email});
        }
    });
});

/**
 * @swagger
 * path: /authenticate
 * operations:
 *   -  httpMethod: POST
 *      summary: Returns a token based on email and password
 *      notes: Email and password are checked, if they check out then a new token will be issues with an expiration date and these details will be stored in the DB.
 *      nickname: Authenticate
 *      consumes:
 *        - text/html
 *      parameters:
 *        - name: email
 *          description: Your email Address
 *          paramType: form
 *          required: true
 *          dataType: string
 *        - name: password
 *          description: Your password
 *          paramType: form
 *          required: true
 *          dataType: string
 */
router.post("/authenticate", function (req, res, next) {
   var query = User.where('email', req.body.email).where('password', req.body.password);
    query.findOne(function (err, user) {
        if(err) {
            next(Boom.notFound("API Connection Failed"));
        } else if (user == null) {
            next(Boom.notFound("Authentication failure for " + req.body.email));
        } else {
            var token = new Token({
                user_id: user._id,
                token: createToken(),
                expiration: newTimeStamp()
            });
            token.save(function (err) {
                if (err) {
                    next(err);
                } else {
                    res.send({
                        token: token.token,
                        timestamp: token.expiration
                    });
                }
            });
        }
    });
});

var checkAuth = exports.checkAuth = function (req, res, next) {
    console.log("checkAuthorisation");
    var token = req.headers.authorization;
    console.log(token);
    var query = Token.where('token', token);
    query.findOne(function (err, tok) {
        if(err) {
            next(Boom.notFound("DB Connection Failed"));
        }
        else if (tok == null) {
            next(Boom.unauthorized("Token not Found"));
        }
        else {
            if((tok.expiration + expirationTime) > newTimeStamp()) {
                console.log("Authentication Successful!");
                req.user = {};
                res.user.id = tok.user_id;
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
 * path: /users
 * operations:
 *   -  httpMethod: POST
 *      summary: Add a new user
 *      notes: Posts email and password
 *      nickname: RegisterUser
 *      consumes:
 *        - application/json
 *      parameters:
 *        - name: username
 *          description: Your username
 *          paramType: body
 *          required: true
 *          dataType: string
 *        - name: password
 *          description: Your password
 *          paramType: body
 *          required: true
 *          dataType: string
 */

router.post("/", function(req, res, next) {
    var query = User.where('email', req.body.email);
    query.findOne(function (err, user) {
       if (err) {
           next(Boom.notFound("API Connection Failed"));
       }
       else if (user == null) {
           var newUser = new User ({
               email:req.body.email,
               password:md5(req.body.password),
               token: createToken(),
               expiration: newTimeStamp()
           });
           console.log(req.body.email);
           var atSymbol = req.body.email.indexOf("@");
           var dotSymbol = req.body.email.lastIndexOf(".");

           if (req.body.password.length < 8) {
               next(Boom.unauthorized("The password entered needs to be more than 8 characters."));
           }
           // Check for @ symbol in email address
           else if (atSymbol < 1 || dotSymbol < atSymbol + 2 || dotSymbol + 1 >= req.body.email.length) {
               next(Boom.unauthorized("The following email address: " + req.body.email + " is invalid."));
           }
           else {
               newUser.save(function (err) {
                   if (err) {
                       next(err);
                   }
                   else {
                       res.send({
                           email: req.body.email,
                           password: md5(req.body.password),
                           token: createToken(),
                           expiration: newTimeStamp()
                       });
                   }
               });
           }
       }
       else if (user.email == req.body.email) {
           next(Boom.unauthorized("The following email address: " + req.body.email + " already exists."));
       }
    });
});

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
