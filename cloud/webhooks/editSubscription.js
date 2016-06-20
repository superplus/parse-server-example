
var moment = require('moment');


function getDurationFromSKU(sku) {
	switch (sku) {
		case "superspeak_3months": return moment.duration(3, 'months');
		case "superspeak_6months": return moment.duration(6, 'months');
		case "superspeak_12months": return moment.duration(1, 'years');
		case "superspeak_12months_earlybird": return moment.duration(1,'years');
		default: throw "Unrecognized sku '" + sku + "'";
	}
}


exports.get = function(req, res) {
	var username = req.params.username;
	
	if (!username) {
		res.render('editSubscription', {});
		return;
	}
	
	Parse.Cloud.useMasterKey();
	new Parse.Query(Parse.User).equalTo('username', username).first()
		.then(function(user) {
			if (user === undefined)
			{
				//res.send(404);
				res.render('editSubscription',{error:"User not found"})
			}
			else if (user.get('subscriptions') === undefined || user.get('subscriptions').length == 0)
			{
				res.render('editSubscription', {
					username: username,
					hasSubscription: false
				})
			}
			else
			{
				var subscriptions = user.get('subscriptions');
				var subscription = subscriptions[subscriptions.length - 1];
				var trialDaysIncluded = subscription.trialDaysIncluded || 0;
				
				var startDate = moment.utc(subscription.date);
				var originalEndDate = moment(startDate).startOf('day').add(getDurationFromSKU(subscription.sku));
				var endDate = moment(originalEndDate).add('days', trialDaysIncluded);
				var daysLeft = endDate.diff(moment.utc().startOf('day'), 'days');
				 
				res.render('editSubscription', {
					username: username,
					hasSubscription: true,
					startDate: startDate.toDate().toUTCString(),
					endDate: endDate.toDate().toUTCString(),
					originalEndDate: originalEndDate.toDate().toUTCString(),
					daysLeft: daysLeft,
					trialDaysIncluded: trialDaysIncluded
				});
			}
		},
		function(error) {
			res.send(500, error);
		});
};


exports.put = function(req, res) {
	var username = req.params.username;
	var trialDaysIncluded = req.body.trialDaysIncluded;
	
	Parse.Cloud.useMasterKey();
	new Parse.Query(Parse.User).equalTo('username', username).first()
		.then(function(user) {
			var subscriptions = user.get('subscriptions');
			subscriptions[subscriptions.length - 1].trialDaysIncluded = trialDaysIncluded;
			user.set('subscriptions', subscriptions);
			return user.save();
		}).then(function() {
			res.status(200);
			res.send("");
		},
		function(error) {
			res.status(500);
			res.send(error);
		});
}


exports.post = function(req, res) {
	var username = req.params.username;
	var sku = req.body.sku;
	var subscription = {
		date: new Date().toISOString(),
		receipt: "manual_receipt",
		sku: sku,
		trialDaysIncluded: 0
	};
	
	Parse.Cloud.useMasterKey();
	new Parse.Query(Parse.User).equalTo('username', username).first()
		.then(function(user) {
			user.add('subscriptions', subscription);
			return user.save();
		}).then(function() {
			res.status(200);
			res.send("");
		},
		function(error) {
			res.status(500);
			res.send(error);
		});
}



