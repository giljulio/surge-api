var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');


mongoose.connect('mongodb://heroku_app33107225:on73hou5s4fits0ip4gsmggerq@ds031551.mongolab.com:31551/heroku_app33107225');

var users = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', users);


// catch 404 and forward to error handler
/*
app.use(function(req, res, next) {
});
 */


// error handlers
// development error handler
// will print stacktrace
/*if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {

    });
}*/


// production error handler
// no stacktraces leaked to user
/*app.use(function(err, req, res, next) {

});*/


module.exports = app;
