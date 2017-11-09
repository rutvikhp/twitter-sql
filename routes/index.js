'use strict';
var express = require('express');
var router = express.Router();
// var tweetBank = require('../tweetBank');
var client = require('../db/index');

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){

//   user_id
    client.query(`SELECT u.name, t.content, u.picture_url, t.id
        FROM tweets t, users u
        WHERE t.user_id = u.id`, function (err, result) {
      if (err) return next(err);
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
      // var allTheTweets = tweetBank.list();
    //   res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: allTheTweets,
    //   showForm: true
    // });

  }






  router.get('/users/:username', function(req, res, next){



    client.query(`SELECT u.name, t.content, t.id, u.picture_url
        FROM tweets t, users u
        WHERE t.user_id = u.id
          AND u.name = $1`, [req.params.username], function (err, result) {
      if (err) return next(err);
      var tweets = result.rows;
      console.log(tweets);
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    client.query(`SELECT u.name, t.content, t.id, u.picture_url
        FROM tweets t, users u
        WHERE t.user_id = u.id AND t.id = $1`, [req.params.id], function (err, result) {
          if (err) return next(err);
          var tweets = result.rows;
          res.render('index', {title: 'Twitter.js', tweets: tweets, showForm: true });
        });
      });


    // var tweetsWithThatId = tweetBank.find({ id: Number(req.params.id) });
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: tweetsWithThatId // an array of only one element ;-)
    // });


  // create a new tweet
  router.post('/tweets', function(req, res, next){
    client.query(`SELECT id FROM users WHERE name = $1`, [req.body.name], function (err, result) {
          if (err) return next(err);
          if (result.rows.length === 0) {
            client.query(`INSERT INTO users(name) VALUES ($1)`, [req.body.name], function (err, result) {
              if (err) return next(err);

            })
            client.query(`SELECT id FROM users WHERE name = $1`, [req.body.name], function (err, result) {
              var tweets = result.rows[0].id;
              client.query(`INSERT INTO tweets (user_id, content) VALUES ($1, $2)`,
                    [tweets, req.body.content], function (err, result) {
                    if (err) return next(err);
                    console.log(tweets);
                    res.redirect('/');
                  });

            });

          } else {
            var tweets = result.rows[0].id;
          client.query(`INSERT INTO tweets (user_id, content) VALUES ($1, $2)`,
                [tweets, req.body.content], function (err, result) {
                if (err) return next(err);
                console.log(tweets);
                res.redirect('/');
              });
            }
        });

  });


  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);


  return router;
}
