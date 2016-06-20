Slack = require("cloud/slack.js");

exports.post = function(req, res) {

	var slack = new Slack();
	console.log (req.query);
	var eventName = req.query.event;
	console.log( req.body.users );
	var data = JSON.parse(req.body.users);
	var message = "";
	if( eventName == "registered14inactive7") {
		for( var user in data ) {
			message += data[user]["$properties"]["$email"] + " registered 14 days ago and has not been active the last 7 days. Last seen " + data[user]["$properties"]["$last_seen"] + " \n";
		}
		if( message != "") {
			slack.send({text: message , channel: "#usagestats"}).then(function(re){
				console.log('Success sending Mixpanel event ' + eventName + ' to slack');
				res.end();
			}, function(error){
				console.log('Error sending Mixpanel event ' + eventName + ' to slack' + error );
				res.end();
			});
		}
	}
};
