






module.exports = function(app, passport, db, gfs) {


    app.get('/',function(req,res){

        res.send('<h1>welcome link a goal!</h1>');
    })

    app.get('/404',function(req,res){
        res.send('<h1>404: page not found</h1>');
    })


};



function getPassedHoursFromDate(ISODateString) {
    var startDate = moment(ISODateString);
    var endDate = moment();
    var differenceInMilliSeconds = endDate.diff(startDate);
    var duration = moment.duration(differenceInMilliSeconds);
    return duration._data.hours;
}
