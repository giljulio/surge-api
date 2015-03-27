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


router.get("/", function(req, res, next) {
    res.send({'api version': '1.0', 'teamMembers':['Gil Sinclair-Julio','Matthew West','Qasim Shabir','Aaron Lewis'], 'message':'Please Refer to the API documentation http://www.trysurge.com/api-playground/ for more information'});
});

module.exports = router;