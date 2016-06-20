Sharing = require("cloud/Sharing.js");

exports.main = function(request, response){
	var subscriptions = request.user.get('subscriptions');
	if (subscriptions !== undefined && subscriptions.length > 0){
		Parse.Promise.when(
			Sharing.addInviteReward(
				subscriptions, 
				request.user.get('email'))
		).then(
			function(result){
				console.log(result.rewarded);
				if (result.rewarded){
					request.user.save('subscriptions', subscriptions);
				}
				response.success(result);
			},
			function(error){
				// Error occurred
				response.error(error);
			}
		);
	}
	else{
		response.success({rewarded:false});
	}
}