var fs = require('fs');
var Twitter = require('twitter');
var profanity = require('profanity-middleware');
var filter = profanity.filter;
var argv = require('yargs')
		.usage('Usage: --consumer-key=[key] --consumer-secret=[key] --access-token-key=[key] --access-token-secret=[key]')
		.demand(['consumer-key', 'consumer-secret', 'access-token-key', 'access-token-secret'])
		.argv;

// Check that we got the arguments we need

var lastSeenId;
try {
	lastSeenId = fs.readFileSync('lastSeenId', 'utf-8');	
} catch (ex) {
	console.log('No last seen ID on record, will default and create a new file.');
}

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
	count: 10, 
	'exclude_replies': true, 
	'include_rts': false, 
	'trim_user': true,
	'since_id': lastSeenId
}, function (err, tweets, res) {
	if (err) {
		console.error('Have a problem:', err);
		throw err;
	}
	tweets.reverse().forEach(tweet => {
		if (tweet.id == lastSeenId) {
			// Twitter will still give you a tweet that you've already seen even if you request since_id, and we don't want to post a duplicate.
			return;
		}

		if (tweet.id > newLastSeenId) newLastSeenId = tweet.id;

		console.log(filter(tweet.text));

		if (tweet.text == filter(tweet.text)) {
			// No need to clean up, just retweet the original
			console.log('## No change, retweeting...');
			client.post('statuses/retweet/' + tweet.id, function(err, tweet, res) {
				if (err) {
					console.warn('Problem retweeting tweet.', err);
				} else {
					console.log('Retweeted tweet.');
				}
			});
		} else {
			// Cleaned up, so put out a new tweet
			console.log('## Cleaned up, new tweet...');
			client.post('statuses/update', {
				'status': filter(tweet.text)
			}, function(err, tweet, res) {
				if (err) {
					console.warn('Problem posting tweet.', err);
				} else {
					console.log('Posted tweet.');
				}
			});
		}

		
	});	
	fs.writeFileSync('lastSeenId', newLastSeenId);
});
