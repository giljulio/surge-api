var md5 = require('MD5');
var APIeasy = require('api-easy'),
    assert = require('assert');

var suite = APIeasy.describe('your/awesome/api');

var randnum = Math.floor(Math.random()*1111)

suite.discuss('When using your awesome API')
    .discuss('test email is stored correctly using the API')
    .use('localhost', 3000)
    .setHeader('Content-Type', 'application/json')
    .post('/users', { email:'test'+randnum+'@gmail.com', password:'bants' })
    .expect("email that we just posted",  function (err, res, body){
        var result = JSON.parse(body);
        console.log(result);
        assert.include(result.email, 'test'+randnum+'@gmail.com');
    })
    .export(module);


//not working, will come back to it
//suite.discuss('When using your awesome API')
//    .discuss('test password is stored correctly')
//    .use('localhost', 3000)
//    .setHeader('Content-Type', 'application/json')
//    .post('/users', { email:'test'+randnum + 1 +'@gmail.com', password:('bants')})
//    .expect("password that we just posted",  function (err, res, body){
//        var result = JSON.parse(body);
//        var pass =  md5(result.password)
//        assert.include(pass, ('bants'));
//        console.log(pass);
//
//    })
//    .export(module);


