
function mailchimpRequest(method, options) {

	console.log(">> MailChimp request: " + JSON.stringify(options));


	options.apikey = "a904d837b3a0df0e85f43a9dbe5fe945-us9";
	return Parse.Cloud.httpRequest({
		url: "https://us9.api.mailchimp.com/2.0/" + method + ".json",
		method: 'POST',
		body: JSON.stringify(options),
		success: options.success,
		error: options.error
	});
}

exports.listsSubscribe = function(options) {
	return mailchimpRequest("lists/subscribe", options);
}

exports.listsUnsubscribe = function(options) {
	return mailchimpRequest("lists/unsubscribe", options);
}

exports.listsBatchSubscribe = function(options) {
	return mailchimpRequest("lists/batch-subscribe", options);
}

