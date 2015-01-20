var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var swagger = require('swagger-express');
var path = require('path');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

if (process.env.NODE_ENV === 'development') {
    require('node-env-file')('.env');
}

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(swagger.init(app, {
    apiVersion: '1.0',
    swaggerVersion: '1.0',
    basePath: 'http://localhost:3000',
    swaggerURL: '/api-playground',
    swaggerJSON: '/api-docs.json',
    swaggerUI: './public/swagger/',
    apis: ['./routes/users.js']
}));
app.use(express.static(path.join(__dirname, 'public')));
mongoose.connect(process.env.MONGOLAB_URI);




var users = require('./routes/users');
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
