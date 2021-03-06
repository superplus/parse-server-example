

exports.main = function(request, response) {
	new Parse.Query(Parse.User).equalTo("username", request.params.username).first({
		useMasterKey: true,
		success: function(user) {
			if (user !== undefined)
				response.success(true);
			else
				response.success(false);
		},
		error: function(error) {
			response.error(error);
		}
	});
}
