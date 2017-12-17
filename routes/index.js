'use strict';
var express = require('express');
var router = express.Router();
var client = require('../db');


module.exports = function makeRouterWithSockets (io) {

  const tweetsWithUsersQuery = `
    SELECT tweets.id AS id, tweets.content, users.name, users.picture_url
    FROM tweets
    JOIN users
    ON users.id = tweets.user_id
  `;

  // a reusable function
  function respondWithAllTweets (req, res, next){
    client.query(tweetsWithUsersQuery, (err, result) => {
      if (err) return next(err); // passing ANYTHING to next = "ERROR!!!!"
      var allTheTweets = result.rows;
      res.render('index', {
        title: 'Twitter.js',
        tweets: allTheTweets,
        showForm: true
      });
    });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    client.query(tweetsWithUsersQuery + 'WHERE users.name = $1', [req.params.username], (err, result) => {
      if (err) return next(err);
      var tweetsForName = result.rows;
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweetsForName,
        showForm: true,
        username: req.params.username
      });
    });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next) {
    client.query(tweetsWithUsersQuery + 'WHERE tweets.id = $1', [req.params.id], (err, result) => {
      if (err) return next(err);
      var tweetsWithThatId = result.rows;
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweetsWithThatId // an array of only one element ;-)
      });
    });
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){
    // find the user
    client.query('SELECT * FROM users WHERE name = $1', [req.body.name], (err, result) => {
      if (err) return next(err);
      const user = result.rows[0];
      if (!user) { // if no user?
        //make new user
        client.query('INSERT INTO users (name) VALUES ($1) RETURNING id', [req.body.name], (err, result) => {
          if (err) return next(err);
          const userId = result.rows[0].id;
          // make a tweet
          client.query(
            'INSERT INTO tweets (user_id, content) VALUES ($1, $2) RETURNING id',
            [userId, req.body.content],
            (err, result) => {
              if (err) return next(err);
              // need the tweet with its user info
              const tweetId = result.rows[0].id;
              client.query(tweetsWithUsersQuery + 'WHERE tweets.id = $1', [tweetId], (err, result) => {
                if (err) return next(err);
                var newTweet = result.rows[0]
                io.sockets.emit('new_tweet', newTweet);
                res.redirect('/');
              });
            });
        });
      } else { // if user exists?
        // make a tweet
        client.query(
          'INSERT INTO tweets (user_id, content) VALUES ($1, $2) RETURNING id',
          [user.id, req.body.content],
          (err, result) => {
            if (err) return next(err);
            // need the tweet with its user info
            const tweetId = result.rows[0].id;
            client.query(tweetsWithUsersQuery + 'WHERE tweets.id = $1', [tweetId], (err, result) => {
              if (err) return next(err);
              var newTweet = result.rows[0]
              io.sockets.emit('new_tweet', newTweet);
              res.redirect('/');
            });
          });
      }
    });
  });
  return router;
}
