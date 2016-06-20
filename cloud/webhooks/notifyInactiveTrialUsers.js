

exports.post = function(req, res) {
	var secret = req.params.secret;
	var users = JSON.parse(req.body.users);
	var emails = [];
	
	if (secret !== "R6wt0j0LemyVJ1TpOGhA")
		return res.send(401);
	
	
	var j = 0;
	for (var i = 0; i < users.length; i++)
	{
		var email = users[i].$properties.$email;
		if (email)
		{
			emails[j++] = {
				"email": { email: email },
				"email_type": "html",
				merge_vars: { FNAME: users[i].$properties.$name }
			};
		}
	}
	
	var mailchimpRequest = {
		apikey: "a904d837b3a0df0e85f43a9dbe5fe945-us9",
		id: "75a971971f",
		batch: emails,
		double_optin: false,
		update_existing: true
	};
		
	Parse.Cloud.httpRequest({
		method: 'POST',
		url: "https://us9.api.mailchimp.com/2.0/lists/batch-subscribe.json",
		body: JSON.stringify(mailchimpRequest),
		success: function(result) {
			res.send(200);
		},
		error: function(error) {
			res.send(500, error);
		}
	});
};
