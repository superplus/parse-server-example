
exports.get = function(req, res) {
	
	var elements = [
		"App Installed",
		"Badge Shared",
		"Badge Unlocked",
		"Category Created",
		"Category Changed",
		"Category Deleted",
		"Child Clicked Item",
		"Child Clicked Related Item",
		"Child Repeated Sound",
		"Child Exit Item",
		"Invite Button Clicked",
		"Invite Sent",
		"Invitee Registered",
		"Invitee Subscribed",
		"Inviter Subscribed",
		"Item Changed",
		"Item Created",
		"Item Deleted",
		"Learning module Opened",
		"Learning module Task Completed",
		"Learning module Task Reset",
		"Profile Created",
		"Profile Copied",
		"Profile Deleted",
		"Profile Extended Changed",
		"Profile Photo Changed",
		"Profile Shared",
		"Session End",
		"Session Start",
		"Setting Changed",
		"Subscribe Purchase Cancelled",
		"Subscribe Purchase Completed",
		"Subscribe Purchase Failed",
		"Subscribe Tapped",
		"Subscribe Trial Expired",
		"Subscribe Viewed",
		"Tag Created",
		"Tag Changed",
		"Tag Deleted",
		"Template Selected",
		"Tutorial Began",
		"Tutorial Finished",
		"Tutorial Past",
		"Tutorial Reset",
		"Tutorial Skipped",
		"Tutorial Completed Step",
		"View",
		"User Created",
		"User Login Successful",
		"User Login Error",
		"User Logout",
		"Play Mode Entered",
		"Play Mode Exited",
		"Lesson Selected",
		"Lesson Create",
		"Lesson Save",
		"Lesson Play",
		"Lesson Finished",
		"Find Lesson",
		"My Progress",
		"Lesson Play Again",
		"Lesson Duplicated"
		"Show More",
		"Task Response Time",
		"Sentence Played",
		"Sentence Cleared",
		"Word Played"
	]
	
	
	new Parse.Query("GlobalSettings").equalTo("name", "analyticsListeners").first({ useMasterKey: true })
		.then(function(settings) {
			var value = JSON.parse(settings.get('value'));
			var values = [];
			for (var i = 0; i < elements.length; i++)
				values[i] = (value.indexOf(elements[i]) >= 0);
			res.render("analyticsListeners", { elements: elements, values: values });
		},
		function(error) {
			res.status(500);
			res.send(error);
		});
};


exports.put = function(req, res) {
	var value = JSON.stringify(req.body.value);
	
	Parse.Cloud.useMasterKey();
	new Parse.Query("GlobalSettings").equalTo("name", "analyticsListeners").first()
		.then(function(settings) {
			settings.set('value', value);
			return settings.save();
		}).then(function() {
			res.status(200);
			res.send("");
		},
		function(error) {
			res.status(500);
			res.send(error);
		});
};
