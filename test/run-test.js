var md5 = require('MD5');
var APIeasy = require('api-easy'),
    assert = require('assert');

var suite = APIeasy.describe('your/awesome/api');

var randnum = Math.floor(Math.random()*1111)

//
//suite.discuss('When using your awesome API')
//    .discuss('test email is stored correctly using the API')
//    .use('localhost', 3000)
//    .setHeader('Content-Type', 'application/json')
//    .post('/users', { email:'test'+randnum+'@gmail.com', password:'password123' })
//    .expect("email that we just posted",  function (err, res, body){
//        var result = JSON.parse(body);
//        console.log(result);
//        assert.include(result.email, 'test'+randnum+'@gmail.com');
//    })
//    .export(module);
//
//suite.discuss('When using your awesome API')
//    .discuss('test email inputted is correctly formatted and that password provided is valid')
//    .use('localhost', 3000)
//    .setHeader('Content-Type', 'application/json')
//    .post('/users', { email:'test'+randnum + 1 +'@gmail.com', password:'pass12345' })
//    .expect("email that was posted", function (err, res, body) {
//        var result = JSON.parse(body);
//        console.log(result);
//        assert.include(result.email, 'test'+randnum + 1 +'@gmail.com');
//        assert.include(result.password, '52dcb810931e20f7aa2f49b3510d3805')
//    })
//    .export(module);
//
//suite.discuss('When using your awesome API')
//    .discuss('test that email does not already exist on DB')
//    .use('localhost', 3000)
//    .setHeader('Content-Type', 'application/json')
//    .post('/users', { email:'test123' + randnum +'@gmail.com', password:'pass12345' })
//    .expect("email that was posted", function (err, res, body) {
//        var result = JSON.parse(body);
//        console.log(result);
//        assert.include(result.email, 'test123'+randnum+'@gmail.com');
//    })
//    .export(module);
//
//suite.discuss('When using your awesome API')
//    .discuss('test password is stored correctly')
//    .use('localhost', 3000)
//    .setHeader('Content-Type', 'application/json')
//    .post('/users', { email:'test'+randnum + 3 +'@gmail.com', password:'pass12345'})
//    .expect("password that we just posted",  function (err, res, body){
//        var result = JSON.parse(body);
//        assert.include(result.password, '52dcb810931e20f7aa2f49b3510d3805')
//        //console.log(pass);
//
//    })
//    .export(module);
//
//suite.discuss('When using your awesome API')
//    .discuss('post video')
//    .use('localhost', 3000)
//    .setHeader('Content-Type', 'application/json')
//    .post('/videos', { title: "Far Cry 4 Video Review", up_vote: 421, down_vote: 78, url: "dop7lsV8k3s", category: 5 })
//    .expect("password that we just posted",  function (err, res, body){
//        var result = JSON.parse(body);
//        assert.include(result.category, 5)
//    })
//    .export(module);


suite.discuss('When using your awesome API')
    .discuss('Post A Video')
    .use('localhost', 3000)
    .setHeader('Content-Type', 'application/json')
    .setHeader('Authorization', '876iY2ZlM_zTvPNsB64U5sfiEewmVDSqE_sIKJmkQ3j0qc2pk6bKNg')
    .post('/videos', { title: "match of the day",  url: "www.youtube.com/watch?v=Xr8yTjgHvv4", category: 5 })
    .expect("Xr8yTjgHvv4",  function (err, res, body){
        var result = JSON.parse(body);
        console.log(result);
        assert.include(result.url, 'Xr8yTjgHvv4')
    })
    .export(module);

