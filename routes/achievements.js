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
var users = require('./users');
var models = require('./models');

//est
/**
 * @swagger
 * resourcePath: /achievements
 * description: All about API
 */

/**
 * @swagger
 * path: /
 * operations:
 *   -  httpMethod: GET
 *      summary: Retrieve achievement list
 *      notes: retrieves a list of all of the available achievements
 *      nickname: achievementList
 *      consumes:
 *        - application/json
 */

router.get("/", function(req, res, next){      //Retrieve list of achievements
    res.send({response: "Success!"});
});


module.exports = router;