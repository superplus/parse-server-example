exports.main = function(request, response) {
	Parse.Promise.when(
			new Parse.Query(Parse.User).equalTo("username", request.params.username).first({useMasterKey: true}),
			new Parse.Query("Profile").equalTo("guid", request.params.pid).first({useMasterKey: true})
		).then(
		function(user, profile){
			if (user !== undefined && profile !== undefined){
				if (profile.get('sharedWithEmails').indexOf(request.params.username) != -1){
					user.add("trustedProfileIds", request.params.pid);
					user.save(
						null,
						{
							useMasterKey:true,
							success: function(user){
								response.success({approved:true, reason:"yay"});
							},
							error: function(user, error){
								console.log(error);
								response.success({approved:false, reason:"unknown"});
							}
						});
				}
				else{
					console.log("Not shared with user!");
					response.success({approved:false, reason:"notshared"});
				}
			}
			else{
				console.log("Undefined user?!");
				response.success({approved:false, reason:"unknownuser"});
			}
		},
		function(error) {
			response.error(error);
		}
	);
}
