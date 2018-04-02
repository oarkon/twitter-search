const express = require('express');
const cors = require('cors');
const Twitter = require('twitter');
const app = express();

const client = new Twitter({
	consumer_key: '',
	consumer_secret: '',
  access_token_key: '',
  access_token_secret: ''
});

app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
	res.sendFile('index.html');
});

app.get('/statuses', (req, res) => {
	const opts = {
		q: req.query.q,
		tweet_mode: 'extended',
		lang: 'en',
		result_type: 'recent',
		count: req.query.hasOwnProperty('count') ? req.query.count : 20
	}
	if (req.query.hasOwnProperty('max_id')) opts.max_id = req.query.max_id
	client.get('search/tweets', opts, (error, tweets) => {
		if (error) {
			res.json({error});
		} else {
			res.json(tweets);
		}
	});
});

app.listen(3535, () => console.log('server started on port 3535'));