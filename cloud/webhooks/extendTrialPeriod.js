
var moment = require('moment');

exports.get = function(req, res) {
	var username = req.params.username;

	if (username === undefined) {
		res.render('extendTrialPeriod', { username: "", trialPeriodLength: 0, daysLeft: 0 });
	} else {

		new Parse.Query(Parse.User).equalTo('username', username).first({ useMasterKey: true })
			.then(function(user) {
				if (user === undefined)
					res.send(404);
				else
				{
				var trialPeriodLength = user.get('trialPeriodLength') || 14;
				var endDate = moment.utc(user.createdAt).add('days', trialPeriodLength).startOf('day');
				var daysLeft = endDate.diff(moment.utc().startOf('day'), 'days');
				res.render('extendTrialPeriod', { username: username, trialPeriodLength: trialPeriodLength, daysLeft: daysLeft  });
				}
			},
			function(error) {
				res.status(500);
				res.send(JSON.stringify(error));
			});
	}
};

exports.put = function(req, res) {
	var username = req.params.username;
	var trialPeriodLength = parseInt(req.params.trialPeriodLength);
	
	if (isNaN(trialPeriodLength)) {
		res.status(500);
		res.send("Illegal value '" + req.params.trialPeriodLength + "'");
	}
	
	Parse.Cloud.useMasterKey();
	
	new Parse.Query(Parse.User).equalTo('username', username).first()
		.then(function(user) {
			if (user === undefined)
				return Parse.Promise.error(404);
			user.set('trialPeriodLength', trialPeriodLength);
			return user.save();
		}).then(function() {
			res.send(200);
		},
		function(error) {
			if (typeof error === 'int')
				res.send(error);
			else {
				res.send(500, error);
			}
		});
};

