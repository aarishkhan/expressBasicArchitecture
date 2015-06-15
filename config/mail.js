/**
 * Created by aarish on 2/26/15.
 */
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'Zoho',
    auth: {
        user: 'support@example.com',
        pass: 'password'
    }
});

function sendMail (mailto,subject,messagebody,callback){
    var mailOptions = {
        from: 'nest-Admin ✔ <support@nest.com>', // sender address
        to: mailto, // list of receivers
        subject: subject,//'Forgot Password', // Subject line

        html: messagebody///'Hi ,<h3>'+username+'</h3> <b>This is your Temporary password changing link  <span style="color: #3ba639; font: 15px;"><a href='+application.serverAddress+'/changePasswordLink/'+id+'>'+application.serverAddress+'/changePasswordLink/'+id+'</a></span> </b>' // html body
    };

// send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Message sent: ' + info.response);
            callback();
        }
    });

}
module.exports={
    SendMail:sendMail
}