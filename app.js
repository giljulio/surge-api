var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var swagger = require('swagger-express');
var path = require('path');


//Swagger Documentation: https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md

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
console.log(process.env.ROOT_URL);
app.use(swagger.init(app, {
    apiVersion: '1.0',
    swaggerVersion: '1.0',
    basePath: process.env.ROOT_URL,
    swaggerURL: '/api-playground',
    swaggerJSON: '/api-docs.json',
    swaggerUI: './public/swagger/',
    apis: ['./routes/api/users.js','./routes/api/videos.js']
}));

app.use(express.static(path.join(__dirname, 'public')));
mongoose.connect(process.env.MONGOLAB_URI);

var users = require('./routes/api/users');
app.use('/api/users', users);

var videos = require('./routes/api/videos');
app.use('/api/videos', videos);

var info = require('./routes/api/info');
app.use('/api', info);


/*var achievements = require('./routes/api/achievements');
app.use('/api/achievements', achievements);*/

// catch 404 and forward to error handler
/*
app.use(function(req, res, next) {
});
 */


// error handlers
// development error handler
// will print stacktrace

app.use(function(err, req, res, next) {
    if(err.isBoom){
        console.log(JSON.stringify(err));
        res.set(err.output.headers);
        res.status(err.output.statusCode);
        if(err.data && err.data.type){
            err.output.payload.type = err.data.type;
        }
        res.send(err.output.payload);
        res.end();
    } else if (app.get('env') === 'development') {
        res.send(err);
    }
});


// production error handler
// no stacktraces leaked to user
/*app.use(function(err, req, res, next) {

});*/




module.exports = app;
