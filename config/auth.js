// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

	'facebookAuth' : {
		'clientID' 		: '000000000000000', // your App ID
		'clientSecret' 	: '000000000000000', // your App Secret
		'callbackURL' 	: require('./application.js').serverAddress+'/auth/facebook/callback'

	},

	'twitterAuth' : {
		'consumerKey' 		: '000000000000000',
		'consumerSecret' 	: '000000000000000',
        'accessToken'       : '000000000000000',
        'accessTokenSecret' : '000000000000000',
		'callbackURL' 		: require('./application.js').serverAddress+'/auth/twitter/callback'
	},

	'googleAuth' : {
		'clientID' 		: '000000000000000',
		'clientSecret' 	: '000000000000000',
		'callbackURL' 	: require('./application.js').serverAddress+'/auth/google/callback'
	}

};
