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
var util = require('./util');
var models = require('./models');

var expirationTime = 10512000000; //4 Months in Milliseconds

/**
 * @swagger
 * resourcePath: /users
 * description: All about API
 */


/**
 * Function that checks their authentication token as to whether it's valid or not,
 * not forced so will return a value letting the client they are not authenticated but they can carry on
 */
var checkAuth = exports.checkAuth = function (req, res, next) {
    var query = models.User.where({_id: req.params.user_id, 'tokens.token': req.headers.authorization});
    query.findOne(function (err, tok) {
        if(err) {
            next(Boom.create(404, "DB Connection Failed", {
                type: "failed-connection"
            }));
        } else if (tok == null) {
            req.user = null;
            next();
        } else {
            for(var i = 0; i < tok.tokens.length; i++){
                if(tok.tokens[i].token == req.headers.authorization && (tok.tokens[i].expiration + expirationTime) > util.newTimeStamp()) {
                    req.user = {};
                    req.user.id = tok._id;
                    next();
                    return;
                }
            }
            req.user = null;
            next();
        }
    });
};

/**
 * @swagger
 * path: /userID
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

router.get("/:user_id", [checkAuth, function (req, res, next) {     // returns a users details based on their ID
    console.log("the value of checkauth is: " );
    var selects = "_id username";
    if(req.user && req.params.user_id == req.user.id){
        selects +=" email";
    }
    console.log(selects);
    var query = models.User.where({_id: req.params.user_id}).select(selects);
    query.findOne(function (err, user) {
        if(err) {
            next(Boom.create(404, "DB Connection Failed", {
                type: "failed-connection"
            }));
        } else {
            if(user){
                var userRes = {
                    id:user._id, username:user.username};
                if(user.email){
                    userRes.email = user.email;
                }
                res.send(userRes);
            } else {
                next(Boom.create(404, "user id not found: " + req.params.user_id, {
                    type:"user-not-found"
                }));
            }
        }
    });
}]);

/**
 * @swagger
 * path: /authenticate
 * operations:
 *   -  httpMethod: POST
 *      summary: Returns a token based on email and password
 *      notes: Email or Username and password are checked, if they check out then a new token will be issues with an expiration date and these details will be stored in the DB.
 *      nickname: Authenticate
 *      consumes:
 *        - application/x-www-form-urlencoded
 *      parameters:
 *        - name: userLogin
 *          description: Your email Address or Username
 *          paramType: body
 *          required: true
 *          dataType: string
 *        - name: password
 *          description: Your password
 *          paramType: body
 *          required: true
 *          dataType: string
 */
router.post("/authenticate", function (req, res, next) {        //If the user submits a correct email and password a token and expiration date will be generated
   var query = models.User.where({ $or:[{'email': req.body.userLogin},{'username': (req.body.userLogin.toLowerCase())}]}).where({'password': md5(req.body.password)});
    query.findOne(function (err, user) {
        if(err) {
            next(Boom.create(404, "DB Connection Failed", {
                type: "failed-connection"
            }));
        } else if (user == null) {
            next(Boom.create(401, "invalid username or password for " + req.body.email, {
                type:"incorrect-credentials"
            }));
        } else {
            var token = util.createToken();
            var timeStamp = util.newTimeStamp();
            res.send({token: token, timestamp: timeStamp});
            var newToken = new Token ({
                token: token,
                expiration: timeStamp
            });
            user.tokens.push(newToken);
            user.save();
        }
    });
});





var forceAuth = function (req, res, next) { //Function that checks their authentication token as to whether it's valid or not, forced validation so it will only allow the function to run if they are authenticated
    var token = req.headers.authorization;
    var query = models.User.where({'tokens.token': token });
    query.findOne(function (err, user) {
        if(err) {
            next(Boom.create(404, "DB Connection Failed", {
                type: "failed-connection"
            }));
        } else if (user == null) {
            next(Boom.create(403, "Cannot find token.", {
                type:"token-not-found"
            }));
        } else {
            for(var i = 0; i < user.tokens.length; i++){
                if(user.tokens[i].token == token){
                    if((user.tokens[i].expiration + expirationTime) > util.newTimeStamp()) {
                        req.user = {};
                        req.user.id = user._id;
                        next();
                    } else {
                        next(Boom.create(403, "The token is out of date!", {
                            type:"token-expired"
                        }));
                    }
                    break;
                }
            }
        }
    });

};

router.get("/:user_id/favs", [forceAuth, function(req, res, next){      //Example function of calling a function that requires a user to be authorised
    res.send({response: "Success!"});
}]);




/**
 * @swagger
 * path: /user_id
 * operations:
 *   -  httpMethod: DELETE
 *      summary: Removes a user account and all of their tokens
 *      notes: A users account id is submitted and the document is then deleted from the database. The token is required to be submitted in the authorisation and the user will only be deleted if the token can be found.
 *      nickname: deleteUser
 *      consumes:
 *        - application/json
 *      parameters:
 *        - name: user_id
 *          description: The users ID to delete
 *          paramType: query
 *          required: true
 *          dataType: string
 */
router.delete("/:user_id",[forceAuth, function (req, res, next) {          //Deletes a user by ID
    User.remove({ _id: req.params.user_id }, function(err) {
        if (!err) {
            res.send({message: "User with ID " + req.params.user_id + " has been deleted."});
        }
        else {
            next(Boom.create(404, "user id not found: " + req.params.user_id, {
                type:"user-not-found"
            }));
        }
    });
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
 *        - name: email
 *          description: your email
 *          paramType: body
 *          required: true
 *          dataType: string
 *        - name: password
 *          description: your password
 *          paramType: body
 *          required: true
 *          dataType: string
 *        - name: username
 *          description: your username
 *          paramType: body
 *          required: true
 *          dataType: string
 */

router.post("/", function(req, res, next) {
    var query = models.User.where({ $or:[{'email': req.body.email},{'username': (req.body.username.toLowerCase())}]});
    query.findOne(function (err, user) {
        console.log(user);
       if (err) {
           next(Boom.create(404, "DB Connection Failed", {
               type: "failed-connection"
           }));
       }
       else if (user == null) {
           var token = new Token ({
               token: util.createToken(),
               expiration: util.newTimeStamp()
           })
           var newUser = new models.User ({
               email:req.body.email,
               password:md5(req.body.password),
               username:req.body.username,
               tokens: token
           });
           var atSymbol = req.body.email.indexOf("@");
           var dotSymbol = req.body.email.lastIndexOf(".");

           if (req.body.password.length < 8) {
               next(Boom.create(401, "The password entered needs to be more than 8 characters.", {
                   type: "invalid-password"
               }));
           }
           // Check for @ symbol in email address
           else if (atSymbol < 1 || dotSymbol < atSymbol + 2 || dotSymbol + 1 >= req.body.email.length) {
               next(Boom.create(401, "The following email address: " + req.body.email + " is invalid.", {
                   type: "invalid-email"
               }));
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
                           username:req.body.username,
                           tokens: token
                       });
                   }
               });
           }
       }
       else if (user.email == req.body.email) {
           next(Boom.create(401, "The following email address: " + req.body.email + " already exists.", {
               type: "email-exists"
           }));
       }
       else if (user.username == req.body.username.toLowerCase()) {
           next(Boom.create(401, "The following username: " + req.body.username + " already exists.", {
               type:"username-exists"
           }));
       }
    });
});

module.exports = router;
module.exports.forceAuth = forceAuth;
module.exports.User = models.User;
