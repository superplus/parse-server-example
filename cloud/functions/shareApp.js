var Mandrill = require('mandrill');

var storeInGiftMap = function(user, inviter, invitee, profileId){
	var subs = user.get('subscriptions');
	var inviterSubscribed = subs !== undefined && subs.length > 0;

	var resultStore = new Parse.Promise();

	new Parse.Query("GiftMap")
		.equalTo("inviter", inviter.toLowerCase())
		.equalTo("invitee", invitee.toLowerCase())
		.first(
			{
				useMasterKey: true
			}
		).then(
			function(result){
				if (result === undefined){
					var map = new Parse.Object("GiftMap");
					map.setACL(new Parse.ACL(user));
					map.save(
						{
							inviter: inviter.toLowerCase(),
							invitee: invitee.toLowerCase(),
							inviterStatus: inviterSubscribed ? 'subscribed' : '',
							inviteeStatus: 'invited',
							profileId: profileId
						}).then(
							function(mapAgain){
								console.log(mapAgain);
								mapAgain.save(
									{
										guid: mapAgain.id
									});
								return resultStore.resolve({invited:true});
							},
							function(mapAgain, error){
								return resultStore.resolve({invited:false});
							}
						);
				}
				else{
					return resultStore.resolve({invited:true});
				}
			}
		);

	return resultStore;
}

exports.main = function(request, response){
	var invitees = [];
	for (var i = 0; i < request.params.invitees.length; i++){
		invitees.push(request.params.invitees[i].toLowerCase());
	}


	var userMap = [];
	var userPromise = new Parse.Query(Parse.User).containedIn("username", invitees)
		.find({useMasterKey: true});
	Parse.Promise.when(userPromise)
	.then(
		function(users){
			var promises = [];
			var invited = [];
			var user = request.user;

			for (var i = 0; i < invitees.length; i++){
				var found = false;
				for (var j = 0; j < users.length; j++){
					if (users[j].get("username") == invitees[i]){
						found = true;
						break;
					}
				}

				if (!found){
					// Share with user
					// - Store in GiftMap
					userMap.push({invitee:request.params.invitees[i], invited:true})
					invited.push({email:invitees[i]});

					console.log("INVITED " + invited);
					promises.push(storeInGiftMap(user, user.get("username"), invitees[i], request.params.profileId)
						.then(
							function(result){
							},
							function(error){
					            response.error(new Parse.Error(Parse.Error.OTHER_CAUSE, "Failed storing in GiftMap"));
							}
						));
				}
				else{
					// User already registered
					userMap.push({invitee:request.params.invitees[i], invited:false})
				}
			}

			if (promises.length > 0){
				Parse.Promise.when(promises).then(
					function(){
						console.log("Sending mail through Mandrill from " + user.get("name") + " to " + invited);
						var params = 
							{
								key: 'UJNOUhE5FDGYezERQyx3Ew',
								template_name: request.params.profileId == null ? 'Invite Email' : 'Invite Email On Share',
								template_content: [{name:"test", content:"test"}],
								message: {
									to:invited,
									global_merge_vars: [{
										name: "SHARER_NAME",
										content: user.get("name")
									}]
								},
								async: true
							};
						console.log(params);
						Parse.Cloud.httpRequest({
							method: "POST",
							headers: {"Content-Type": "application/json"},
							url: "https://mandrillapp.com/api/1.0/messages/send-template.json",
							body: params,
							success: function(r){
								console.log("SUCCESS");
								console.log(r);
							},
							error: function(r){
								console.log("ERROR");
								console.log(r);
							}
						});
						response.success(userMap);
					}
				);
			}
			else{
				response.success(userMap);
			}
		},
		function(error){
			// Error occurred
			response.error(error);
		}
	);
}