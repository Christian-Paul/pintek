var express = require('express');
var app = express();
var path = require('path');
var mongoose = require('mongoose');
var Twitter = require('node-twitter-api');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
require('express-helpers')(app);
app.enable('trust proxy');
var port = process.env.PORT || 3000;

// get credentials from config file in dev, or from heroku env in deployment
if(port === 3000) {
	var config = require('./config.js');
} else {
	var config = {
		mongooseUsername: process.env.mongooseUsername,
		mongoosePassword: process.env.mongoosePassword,
		twitterConsumerKey: process.env.twitterConsumerKey,
		twitterConsumerSecret: process.env.twitterConsumerSecret,
		callbackUrl: process.env.callbackUrl,
		sessionSecret: process.env.sessionSecret
	};
}

app.set('view engine', 'ejs');

var sessionOptions = {
	secret: config.sessionSecret,
	saveUninitialized: true,
	resave: false,
	store: new FileStore(),
	name: 'my.connect.sid'
};

// middleware
app.use(session(sessionOptions));
app.use('/public', express.static(path.join(__dirname, 'public')));


// twitter oAuth setup
var twitter = new Twitter({
	consumerKey: config.twitterConsumerKey,
	consumerSecret: config.twitterConsumerSecret,
	callback: config.callbackUrl
});

var _requestSecret;

// when a user clicks 'sign in' get a request token from twitter and redirect user to sign in with token
app.get('/request-token', function(req, res) {
	twitter.getRequestToken(function(err, requestToken, requestSecret) {
		if(err) {
			res.status(500).send(err);
		} else {
			_requestSecret = requestSecret;
			res.redirect('https://api.twitter.com/oauth/authenticate?oauth_token=' + requestToken);
		}
	});
});

// when user is sent back from twitter, use results to obtain credentials
app.get('/login/twitter/callback', function(req, res) {
	var requestToken = req.query.oauth_token;
	var verifier = req.query.oauth_verifier;

    twitter.getAccessToken(requestToken, _requestSecret, verifier, function(err, accessToken, accessSecret) {
        if (err)
            res.status(500).send(err);
        else
            twitter.verifyCredentials(accessToken, accessSecret, function(err, user) {
                if (err)
                    res.status(500).send(err);
                else {
                	req.session.userInfo = user;
                	req.session.save(function(err) {
                		if(err) {
                			console.log(err);
                		} else {
                			res.redirect('/');
                		}
                	});
                }
            });
    });
});

// sign out: destroy session and clear cookies
app.get('/sign-out', function(req, res) {
	req.session.destroy(function(err) {
		if(err) {
			console.log(err);
		} else {
			res.clearCookie(sessionOptions.name);
			res.redirect('/');
		}
	})
});

// database setup
mongoose.connect('mongodb://' + config.mongooseUsername + ':' + config.mongoosePassword + '@ds029106.mlab.com:29106/pintek');


// begin app
app.listen(port, function(req, res) {
	console.log('listening on 3000');
});

// index page queries database for recent pins and sends them to client
app.get('/', function(req, res) {
	res.render('index.ejs', {userInfo: req.session.userInfo});
});


// gets the current user's pins
app.get('/mypins', function(req, res) {

});

// gets a user's pins by username
app.get('/userpins/:tagId', function(req, res) {

});


// deletes a pin
app.get('/delete-pin/:tagId', function(req, res) {

});