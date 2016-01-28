process.env.NODE_TLS_REJECT_UNAUTHORIZED="0";

var fs = require('fs');
var Twitter = require('twitter');
var profanity = require('profanity-middleware');
var filter = profanity.filter;
var argv = require('yargs')
		.usage('Usage: --consumer-key=[key] --consumer-secret=[key] --access-token-key=[key] --access-token-secret=[key]')
		.demand(['consumer-key', 'consumer-secret', 'access-token-key', 'access-token-secret'])
		.argv;

// Check that we got the arguments we need


var lastSeenId = fs.readFileSync('lastSeenId', 'utf-8');
if (!lastSeenId) lastSeenId = 686606848116445200;
var newLastSeenId = lastSeenId;

var client = new Twitter({
	consumer_key: argv['consumer-key'], 
	consumer_secret: argv['consumer-secret'],
	access_token_key: argv['access-token-key'],
	access_token_secret: argv['access-token-secret']
});

client.get('statuses/user_timeline', { 
	'user_id': '1197619002', 
	count: 8, 
	'exclude_replies': true, 
	'include_rts': false, 
	'trim_user': true,
	'since_id': lastSeenId
}, function (err, tweets, res) {
	if (err) {
		console.error('Have a problem:', err);
		throw err;
	}
	tweets.forEach(tweet => {
		if (tweet.id > newLastSeenId) newLastSeenId = tweet.id;

		//console.log(tweet.id);
		console.log(filter(tweet.text));
	});	
	fs.writeFileSync('lastSeenId', newLastSeenId);
});
