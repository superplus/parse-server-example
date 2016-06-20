

exports.main = function(request, response) {
	var user = request.user;
    var profileId = request.params.profileId;

    Parse.Cloud.useMasterKey();
	
    new Parse.Query(Parse.Role).equalTo("name", profileId).first()
        .then(function(role) {
            var relation = role.getUsers();
            relation.remove(user);
            return role.save();
        }).then(function() {
			return new Parse.Query("Profile").equalTo("guid", profileId).first();
		}).then(function(profileObject) {
			console.log("[distrustProfile] " + profileObject.get("guid") + " - " + user.getEmail());
			profileObject.remove("sharedWithEmails", user.getEmail());
			return profileObject.save();
		}).then(function() {
            response.success();
        },
        function(error) {
            response.error(error);
        });
	
	
    
};