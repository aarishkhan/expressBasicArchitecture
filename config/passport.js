// load all the things we need
var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;
var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;

// load up the user model


module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
        function(req, email, password, done) {
            if (email)
                email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

            // asynchronous
            process.nextTick(function() {
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    // if there are any errors, return the error
                    if (err) {

                        return done(err);
                    }
                    // if no user is found, return the message
                    else if (!user) {

                        return done(null, false, req.flash('loginMessage', 'No user found.'));
                    }
                    else if (!user.validPassword(password)) {

                        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
                    }

                    else if(!user.verified){
                        /*
                         *  if the user logging in is not verified notify him and resend an
                         * email of verification link and delete any previous tracking entry if there is.
                         *
                         */
                        var verifyObj = new Verify();
                        verifyObj.verifyObjectId=user._id;
                        deletePreviousVerifyObjectIfFound(user._id,function(){
                            verifyObj.save(function(err,verifyobj){
                                var subject='SignUp Confirmation',
                                    id=user._id,
                                    messagebody='Hi ,<h3>'+user.local.name+'</h3> <b>Please help us ease your sign up and follow this url  <span style="color: #3ba639; font: 15px;"><a href="'+application.serverAddress+'/emailConfirmationLink/'+id+'">'+application.serverAddress+'/emailConfirmationLink/'+id+'</a></span> </b>';

                                mail.SendMail(user.local.email,subject,messagebody,function(){return done(null, false, req.flash('loginMessage', 'Sorry! your email is not verified please check your email. '));});
                            })
                        });


                    }
                    // all is well, return user
                    else {

                        return done(null, user);
                    }
                });
            });

        }));

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {
        // console.dir(req.body.firstName); //here we can check first name and last name we are getting from the signup form
        // console.dir(req.body.lastName);
        var userName= req.body.name.toLowerCase();
        if (email)
            email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

        // asynchronous
        process.nextTick(function() {
            // if the user is not already logged in:

            if (!req.user) {
                User.findOne({ 'local.email' :  email }, function(err, user) {

                    // if there are any errors, return the error

                    if (err) {


                        return done(err);
                    }
                    // check to see if theres already a user with that email
                    else if (user) {


                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));

                    } else {

                        if(userName.match(/ /g)){
                            return done(null, false, req.flash('signupMessage', 'no spaces are allowed in username!'));
                        }
                        if(userName.length>15){
                            return done(null, false, req.flash('signupMessage', 'username should be not more than 15 characters!'));
                        }
                        userName=userName.replace(' ','');
                    User.findOne({'local.name':{$regex: '^'+userName+'$', $options: 'i'}},function(err,userbyname){
                        if(err) {
                            return done(err);
                        }
                        else if (userbyname){
                            return done(null, false, req.flash('signupMessage', 'Username is already taken, please make it a unique one.'));
                        }
                        else{
                            // create the user
                            var newUser            = new User();

                            newUser.local.email    = email;
                            newUser.local.password = newUser.generateHash(password);
                            newUser.local.name     = userName;
                            newUser.newUserFlag=true;

                            newUser.save(function(err,user) {
                                if (err)
                                {   return done(err);}
                                // place a registration of id in a collection and generate url
                                // and email a confirming link to user
                                var verifyObj = new Verify();
                                verifyObj.verifyObjectId=user._id;
                                verifyObj.save(function(err,verifyobj){
                                    var subject='SignUp Confirmation',
                                        id=user._id,
                                        messagebody='Hi ,<h3>'+user.local.name+'</h3> <b>Please help us ease your sign up and follow this url  <span style="color: #3ba639; font: 15px;"><a href="'+application.serverAddress+'/emailConfirmationLink/'+id+'">'+application.serverAddress+'/emailConfirmationLink/'+id+'</a></span> </b>';

                                    mail.SendMail(user.local.email,subject,messagebody,function(){
                                        req.flash('verificationFlag', 'resolve');
                                        return done(null, false);});
                                })


                            });
                        }

                    })

                    }

                });
                // if the user is logged in but has no local account...
            }
            else if ( !req.user.local.email ) {
                // ...presumably they're trying to connect a local account
                // BUT let's check if the email used to connect a local account is being used by another user
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    if (err) {

                        return done(err);
                    }
                    else if (user) {


                        return done(null, false, req.flash('loginMessage', 'That email is already taken.'));
                        // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
                    }
                    else{
                        if(userName.match(/ /g)){
                            return done(null, false, req.flash('signupMessage', 'no spaces are allowed in username!'));
                        }
                        userName=userName.replace(' ','');
                        User.findOne({'local.name':{$regex: '^'+userName+'$', $options: 'i'}},function(err,userbyname) {
                            if (err) {
                                return done(err);
                            }
                            else if (userbyname) {
                                return done(null, false, req.flash('loginMessage', 'Username is already taken, please make it a unique one.'));
                                // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
                            }
                            else {
                                // create the user
                                var user = req.user;
                                user.local.email = email;
                                user.local.password = user.generateHash(password);
                                user.local.name = userName;
                                user.newUserFlag=true;
                                user.save(function (err, user) {
                                    if (err)
                                        return done(err);

                                    return done(null, user);
                                });
                            }
                        })

                        }
                });
            }
            else {
                // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
                return done(null, req.user);
            }

        });

    }));

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({

        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {

                User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {

                        // if there is a user id already but no token (user was linked at one point and then removed)
                        if (!user.facebook.token) {
                            user.facebook.token = token;
                            user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                            user.facebook.email = (profile.emails[0].value || '').toLowerCase();

                            user.save(function(err) {
                                if (err)
                                    return done(err);
                                    
                                return done(null, user);
                            });
                        }

                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user, create them
                        var newUser            = new User();

                        newUser.facebook.id    = profile.id;
                        newUser.facebook.token = token;
                        newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                        newUser.facebook.email = (profile.emails[0].value || '').toLowerCase();
                        //first time user connecting through facebook means he or she is already verified
                        //that is why putting verified flag up.
                        newUser.verified=true;
                        newUser.save(function(err) {
                            if (err)
                                return done(err);
                                
                            return done(null, newUser);
                        });
                    }
                });

            } else {
                // user already exists and is logged in, we have to link accounts
                var user            = req.user; // pull the user out of the session

                user.facebook.id    = profile.id;
                user.facebook.token = token;
                user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                user.facebook.email = (profile.emails[0].value || '').toLowerCase();

                user.save(function(err) {
                    if (err)
                        return done(err);
                        
                    return done(null, user);
                });

            }
        });

    }));

    // =========================================================================
    // TWITTER =================================================================
    // =========================================================================
    passport.use(new TwitterStrategy({

        consumerKey     : configAuth.twitterAuth.consumerKey,
        consumerSecret  : configAuth.twitterAuth.consumerSecret,
        callbackURL     : configAuth.twitterAuth.callbackURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, tokenSecret, profile, done) {

        console.dir(profile);
        //console.log("=-=-=-==-=-=-=-=-=-=-=-=-=-=-=-=-=-=");
        //console.log(profile._json.profile_background_image_url_https);
        //user.twitter.profile_background_image_url_https = profile.profile_background_image_url_https;
        //console.log(profile._json.profile_image_url);
        //user.twitter.profile_image_url_https = profile.profile_background_image_url_https;

        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {

                User.findOne({ 'twitter.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {
                        // if there is a user id already but no token (user was linked at one point and then removed)
                        if (!user.twitter.token) {
                            user.twitter.token       = token;
                            user.twitter.tokenSecret = tokenSecret;
                            user.twitter.username    = profile.username;
                            user.twitter.displayName = profile.displayName;
                            user.twitter.profile_background_image_url = profile._json.profile_background_image_url;
                            user.twitter.profile_background_image_url_https = profile._json.profile_background_image_url_https;
                            user.twitter.profile_image_url = profile._json.profile_image_url.replace('_normal.png','_bigger.png');
                            user.twitter.profile_image_url_https = profile._json.profile_image_url_https.replace('_normal.png','_bigger.png');

                            user.save(function(err) {
                                if (err)
                                    return done(err);
                                    
                                return done(null, user);
                            });
                        }

                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user, create them
                        var newUser                 = new User();

                        newUser.twitter.id          = profile.id;
                        newUser.twitter.token       = token;
                        newUser.twitter.tokenSecret = tokenSecret;
                        newUser.twitter.username    = profile.username;
                        newUser.twitter.displayName = profile.displayName;
                        newUser.twitter.profile_background_image_url = profile._json.profile_background_image_url;
                        newUser.twitter.profile_background_image_url_https = profile._json.profile_background_image_url_https;
                        newUser.twitter.profile_image_url = profile._json.profile_image_url.replace('_normal.png','_bigger.png');
                        newUser.twitter.profile_image_url_https = profile._json.profile_image_url_https.replace('_normal.png','_bigger.png');
                        //first time user connecting through twitter means he or she is already verified
                        //that is why putting verified flag up.
                        newUser.verified=true;
                        newUser.save(function(err) {
                            if (err)
                                return done(err);
                                
                            return done(null, newUser);
                        });
                    }
                });

            } else {
                // user already exists and is logged in, we have to link accounts
                var user                 = req.user; // pull the user out of the session

                user.twitter.id          = profile.id;
                user.twitter.token       = token;
                user.twitter.tokenSecret = tokenSecret;
                user.twitter.username    = profile.username;
                user.twitter.displayName = profile.displayName;
                user.twitter.profile_background_image_url = profile._json.profile_background_image_url;
                user.twitter.profile_background_image_url_https = profile._json.profile_background_image_url_https;
                user.twitter.profile_image_url = profile._json.profile_image_url.replace('_normal.png','_bigger.png');
                user.twitter.profile_image_url_https = profile._json.profile_image_url_https.replace('_normal.png','_bigger.png');

                user.save(function(err) {
                    if (err)
                        return done(err);
                        
                    return done(null, user);
                });
            }

        });

    }));

    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    passport.use(new GoogleStrategy({

        clientID        : configAuth.googleAuth.clientID,
        clientSecret    : configAuth.googleAuth.clientSecret,
        callbackURL     : configAuth.googleAuth.callbackURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {

                User.findOne({ 'google.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {

                        // if there is a user id already but no token (user was linked at one point and then removed)
                        if (!user.google.token) {
                            user.google.token = token;
                            user.google.name  = profile.displayName;
                            user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                            user.save(function(err) {
                                if (err)
                                    return done(err);
                                    
                                return done(null, user);
                            });
                        }

                        return done(null, user);
                    } else {
                        var newUser          = new User();

                        newUser.google.id    = profile.id;
                        newUser.google.token = token;
                        newUser.google.name  = profile.displayName;
                        newUser.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
                        //first time user connecting through google means he or she is already verified
                        //that is why putting verified flag up.
                        newUser.verified=true;
                        newUser.save(function(err) {
                            if (err)
                                return done(err);
                                
                            return done(null, newUser);
                        });
                    }
                });

            } else {
                // user already exists and is logged in, we have to link accounts
                var user               = req.user; // pull the user out of the session

                user.google.id    = profile.id;
                user.google.token = token;
                user.google.name  = profile.displayName;
                user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                user.save(function(err) {
                    if (err)
                        return done(err);
                        
                    return done(null, user);
                });

            }

        });

    }));

};

function deletePreviousVerifyObjectIfFound(id,callback){
    Verify.findOne({verifyObjectId:id},function(err,vobj){
        vobj.remove(function(err){
            if(!err){
                callback();
            }
        })
    })
}
