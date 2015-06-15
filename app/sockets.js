//sockets
var Twit = require('twit') //for receiving tweeter tweet streams
module.exports = function(io, db, imagedb, gfs) {
    io.sockets.on('connection', function (socket) {
        console.log("new connection");

        //get all the ballotboxes in which a user voted
        require('./serverLogicFiles/votedBallotBoxes.js')(socket,db, imagedb);

        //get all the ballotboxes that the user created
        //========= for user's created votables/ballotboxes
        require('./serverLogicFiles/userBallotBoxes.js')(socket,db, imagedb);

        require('./serverLogicFiles/blackWallBallotBoxes.js')(socket,db);


        //when a url link is opened of twitter tweet votable.
        require('./serverLogicFiles/singleBallotBox.js')(socket,db, imagedb);


        //when someone make tweet ballot from mytweets page or from following tweets page
        require('./serverLogicFiles/makeBallotFromTweet.js')(socket,db,gfs, imagedb);

        require('./serverLogicFiles/makeBallotFromFetchedTweetRedundant.js')(socket,db,gfs, imagedb);

        //when someone make independent ballotbox from any page
        require('./serverLogicFiles/makeBallotBox.js')(socket,db,gfs, imagedb);


        //======twitter follings page
        require('./serverLogicFiles/requestFollowingTweets.js')(socket,db, imagedb);


        //======twitter mytweets page
        require('./serverLogicFiles/requestTimelineTweets.js')(socket,db, imagedb);


        //when someone click on radio button %votable tweet stream%
        //require('./serverLogicFiles/radioVoteEvent.js')(socket,db);


        //when someone click on radio button %votable single tweet%
        require('./serverLogicFiles/votableRadioVoteEvent.js')(socket,db, imagedb);

        //when someone click on add ballotbox button
        require('./serverLogicFiles/checkBallotBoxLimitForUser.js')(socket,db, imagedb);

        //when someone click on add tweet ballotbox button
        require('./serverLogicFiles/checkTweetBallotBoxLimitForUser.js')(socket,db, imagedb);

        //when someone click on add tweet ballotbox button
        require('./serverLogicFiles/getCarouselImageUpload.js')(socket,db,gfs, imagedb);

        //when someone wants to deselect image or cancel ballot box creation
        require('./serverLogicFiles/getCarouselImageDelete.js')(socket,db,gfs, imagedb);

        //when someone disconnects from the web server
        require('./serverLogicFiles/socketDisconnect.js').deleteRoutine(socket,db,gfs, imagedb);

        //check for bots when someone click to create ballot box or create tweet ballot box or vote
        require('./serverLogicFiles/verifyUserNotBot.js')(socket);

        require('./serverLogicFiles/getUserDetails.js').getUserDetails(socket,db, imagedb);

        require('./serverLogicFiles/getFollowButton.js')(socket,db, imagedb);

        require('./serverLogicFiles/followUser.js')(socket,db);

        require('./serverLogicFiles/unFollowUser.js')(socket,db);

        require('./serverLogicFiles/checkPlacementId.js')(socket,db);

        require('./serverLogicFiles/renamePlacementId.js')(socket,db);

        require('./serverLogicFiles/getPlacementIdAndCreatorNameFromObjId.js')(socket,db);

        require('./serverLogicFiles/searchUsersByName.js')(socket,db);

        require('./serverLogicFiles/getFollowers.js')(socket,db);

        require('./serverLogicFiles/getFollowings.js')(socket,db);

        require('./serverLogicFiles/getPostFromId.js')(socket,db);




    });

}