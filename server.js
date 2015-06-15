// server.js

// set up ======================================================================
// get all the tools we need
var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient
var passport = require('passport');
var flash = require('connect-flash');
var fs= require('fs');

var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var configDB = require('./config/database.js');

var http = require('http');
var config=require("./config/application.js");


/*var options = {
    key: fs.readFileSync(config.keyFilePath),
    cert: fs.readFileSync(config.certFilePath)
};
*/

var httpServer = http.createServer(app);
var io = require('socket.io').listen(httpServer);
var passportSocketIo = require("passport.socketio");
var mongo = require('mongodb');
var Grid = require('gridfs-stream');















// configuration ===============================================================
var db,imagedb;

mongoose.connect(configDB.url
    // { mongos: true },
    // 			{ ssl : true } ,
    // 			function(){}
); // connect to our database

    MongoClient.connect(configDB.url, function (err, database) {
        if (err)console.dir(err);
        else console.log("mongoclient connected");

        db = database;




// set up our express application
        app.use(morgan('dev')); // log every request to the console
        app.use(cookieParser()); // read cookies (needed for auth)
        app.use(bodyParser.json()); // get information from html forms
        app.use(bodyParser.urlencoded({extended: true}));

        app.set('view engine', 'ejs'); // set up ejs for templating

        app.use(express.static(__dirname + '/public'));

        var mongostore = new MongoStore({
            db: db
        });

// required for passport
        app.use(session({
            key: 'express.sid',
            secret: 'asdasdasdasd',
            store: mongostore,
            resave: true,
            saveUninitialized: true,
            cookie: {maxAge: 1000 * 60 * 60 * 24 * 14}//1000 miliseconds = 1 second, 60 seconds = 1 min

        }));


        io.use(passportSocketIo.authorize({
            passport: passport,		//http://stackoverflow.com/questions/23492459/passport-socketios-passport-failed-to-deserialize-user-out-of-session-but-pa
            cookieParser: cookieParser,
            key: 'express.sid',       // the name of the cookie where express/connect stores its session_id
            secret: 'asdasdasdasd',    // the session_secret to parse the cookie
            store: mongostore,        // we NEED to use a sessionstore.
            success: onAuthorizeSuccess,  // *optional* callback on success - read more below
            fail: onAuthorizeFail     // *optional* callback on fail/error - read more below
        }));
        function onAuthorizeSuccess(data, accept) {
            console.log('successful connection to socket.io');

            // The accept-callback still allows us to decide whether to
            // accept the connection or not.
            // accept(null, true);

            // OR

            // If you use socket.io@1.X the callback looks different
            accept();
        }

        function onAuthorizeFail(data, message, error, accept) {
            if (error)
                throw new Error(message);
            console.log('failed connection to socket.io:', message);

            // We use this callback to log all of our failed connections.
            // accept(null, false);

            // OR

            // If you use socket.io@1.X the callback looks different
            // If you don't want to accept the connection
            // if(error)
            //   accept(new Error(message));
            accept();
            // this error will be sent to the user as a special error-package
            // see: http://socket.io/docs/client-api/#socket > error-object
        }

        app.use(passport.initialize());
        app.use(passport.session()); // persistent login sessions
        app.use(flash()); // use connect-flash for flash messages stored in session

// sockets =====================================================================
        //require('./app/sockets.js')(io, db, imagedb, gfs); // set our sockets and pass in our io and database
// routes ======================================================================
        require('./app/routes.js')(app, passport, db); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
        httpServer.listen(port);
// app.listen(port);
        console.log('The server started on port ' + port);


});