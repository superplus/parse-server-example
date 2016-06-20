

/// Various requires
require("cloud/app.js");

RedeemPromoCode = require("cloud/functions/redeemPromoCode.js");
MailChimpIntegration = require("cloud/functions/mailChimpIntegration.js");
Sharing = require("cloud/Sharing.js");
Slack = require("cloud/slack.js");
/// Function definitions

var defineFunction = function(name) {
    var module = require("cloud/functions/" + name + ".js");
    Parse.Cloud.define(name, function(request, response) { module.main(request, response); });
}

var defineJob = function(name) {
    var module = require("cloud/jobs/" + name + ".js");
    Parse.Cloud.job(name, function(request, status) { module.main(request, status); });
}

defineFunction("commitGlobalFile");
defineFunction("commitGlobalImage");
defineFunction("currentTime");
defineFunction("deleteObject");
defineFunction("deleteObjects");
defineFunction("distrustProfile");
defineFunction("getGlobalSettings");
defineFunction("getResourceFile");
defineFunction("logError");
defineFunction("saveObject");
defineFunction("shareProfile");
defineFunction("shareLesson");
defineFunction("userExists");
defineFunction("userEmail");
defineFunction("shareApp");
defineFunction("afterLogin");
defineFunction("approveSharedProfile");
defineFunction("lessonPlayed");
defineFunction("redeemPromoCode");
defineFunction("mixpanelRequest");
defineFunction("sharedProfileApproved");

defineJob("cleanServer");
defineJob("setProfileAccessForRole");
defineJob("adHocStats");
defineJob("addUserToRole");
defineJob("approvePublicLessons");
defineJob("migrateFiles");

/// Custom User creation data
Parse.Cloud.beforeSave(Parse.User, function(request, response) {

	if (request.object.isNew())
	{
		var promoCode = request.object.get('promoCode');
		if (promoCode !== undefined && promoCode !== null){
			console.log('Promo code present: ' + request.object.get('promoCode'));
			RedeemPromoCode.usePromoCode(promoCode).then(
		        function(result){
		        	console.log('Checked promo code and the result is ' + result.success);
		        	if (result.success){
		        		if (result.subscription != null){
							request.object.set('trialPeriodLength', 0);
							request.object.add('subscriptions', result.subscription);
						}
						else{
							request.object.set('trialPeriodLength', result.trialdays);
						}
						MailChimpIntegration.addToSubscribersList(request, response.success);
		        	}
		        	else{
			            response.error(new Parse.Error(result.errorCode, "Promo code reject with code " + result.errorCode));
		        	}
		        },
		        function(error){
		        	console.log('Something happened while checking the promo code ' + error);
		            response.error(error);
				});
		}
		else{
			console.log('NO promo code present');
			MailChimpIntegration.addToTrialList(request, response.success);
		}

	}
	else if (request.object.dirty('subscriptions'))
	{
		MailChimpIntegration.removeFromTrialList(request, response);

		var slack = new Slack();
        slack.send({text: "User subscribed: " + request.object.get('email') , channel: "#usagestats"}).then(function(){
          console.log('success sending new user subscription sending to slack');
        }, function(error){
          console.log('error sending new user subscription to slack: ' + error );
        });
	}
	else{
		response.success();
	}
});

Parse.Cloud.afterSave(Parse.User, function(request) {
	var user = request.object;

	if (!user.existed()){
		var acl = new Parse.ACL(user);
		user.setACL(acl);
		user.save();


		var func = function(result){
			user.set("invited", result.invited);
			user.save();
		};

		Sharing.wasInvited(user).then(
			func
		);
	}
});
