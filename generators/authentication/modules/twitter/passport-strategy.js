
// Sign in with Twitter
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_KEY,
  consumerSecret: process.env.TWITTER_SECRET,
  callbackURL: '/auth/twitter/callback',
  passReqToCallback: true
}, function(req, accessToken, tokenSecret, profile, done) {
  if (req.user) {
    User.findOne({ twitter: profile.id }, function(err, user) {
      if (user) {
        req.flash('error', { msg: 'There is an existing Twitter account that belongs to you. ' +
        'Sign in with that account, or delete it and then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, function(err, user) {
          user.name = user.profile.name || profile.displayName;
          user.location = user.profile.location || profile._json.location;
          user.picture = user.profile.picture || profile._json.profile_image_url_https;
          user.twitter = profile.id;
          user.save(function(err) {
            req.flash('info', { msg: 'Your Twitter account has been linked successfully.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ twitter: profile.id }, function(err, existingUser) {
      if (existingUser) {
        return done(null, existingUser);
      }
      // Twitter does not provide an email address, but email is a required field in our User schema.
      // We can "fake" a Twitter email address as follows: username@twitter.com.
      // It should be changed by a user to their real email address afterwards.
      // For example, after login, check if email contains @twitter.com, then redirect to My Account page,
      // and restrict user's page navigation until they update their email address. 
      var newUser = new User({
        name: profile.displayName,
        email: profile.username + '@twitter.com',
        location: profile._json.location,
        picture: profile._json.profile_image_url_https,
        twitter: profile.id
      });
      newUser.save(function(err) {
        done(err, newUser);
      });
    });
  }
}));
