var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var env = require('node-env-file');


env('./.env');



mongoose.connect(process.env.MONGOLAB_URI);

var users = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

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
