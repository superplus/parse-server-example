var addToRole = function(profileId, user){
    var rolePromise = new Parse.Query(Parse.Role).equalTo("name", profileId).first({ useMasterKey: true });
    Parse.Promise.when(rolePromise)
    .then(function(role){
        if (role !== undefined){
            role.getUsers().add(user);
            role.save(null, { useMasterKey: true, wait: true });
        }
    });
}

exports.wasInvited = function(user) {
	var email = user.getEmail().toLowerCase();
	var result = new Parse.Promise();
	
	new Parse.Query("GiftMap").equalTo("invitee", email).find({
		useMasterKey: true,
		success: function(entries) {
			if (entries !== undefined && entries.length > 0){
				var list = [];
				for (var i = 0; i < entries.length; i++){
					var giftMap = entries[i];
					var profileId = giftMap.get("profileId");
					if (profileId !== undefined){
					 	addToRole(profileId, user);
					}
					if (i > 0){
						list.push(giftMap);
					}
				}
				
				Parse.Object.destroyAll(list, {useMasterKey: true, wait:true });

				return result.resolve({invited: true});
			}
			else
				return result.resolve({invited: false});
		},
		error: function(error) {
			return result.reject(error);
		}
	});

	return result;
}

exports.addInviteReward = function(property, email){
	var result = new Parse.Promise();
	
	email = email.toLowerCase();

	var q1 = new Parse.Query("GiftMap").equalTo('inviter', email);
	var q2 = new Parse.Query("GiftMap").equalTo('invitee', email);
 	Parse.Query.or(q1, q2).find({
		useMasterKey: true
	}).then(
		function(entries) {
			var reward = false;

	        var subscription = property[property.length - 1];
	        var trialDaysIncluded = subscription.trialDaysIncluded !== undefined ? subscription.trialDaysIncluded : 0;
			for (var i = 0; i < entries.length; i++){
				var entry = entries[i];
				var who = entry.get('inviter') == email ? 'inviter' : 'invitee';

				if ((who == 'inviter' && entry.get('inviterStatus') != 'rewarded' && entry.get('inviterStatus') != 'rewardedShown' && entry.get('inviteeStatus') == 'rewarded') ||
					(who == 'invitee' && entry.get('inviteeStatus') != 'rewarded'))
				{
					reward = true;
					entry.save(
						who + 'Status', 
						'rewarded',
						{
							useMasterKey: true,
							success: function(entry){console.log("Gift map updated");},
							error: function(entry, error){console.error("Could not update gift map for invited subscriber. " + error.message);}
						});
			        trialDaysIncluded += 31;
			    }
				else if (who == 'inviter' && (entry.get('inviterStatus') == undefined || entry.get('inviterStatus') == ''))
				{
					entry.save(
						who + 'Status', 
						'subscribed',
						{
							useMasterKey: true,
							success: function(entry){console.log("Gift map updated");},
							error: function(entry, error){console.error("Could not update gift map for invited subscriber. " + error.message);}
						});
			    }
			}
	        subscription.trialDaysIncluded = trialDaysIncluded;

		    return result.resolve({rewarded:reward});
		},
		function(error) {
			console.error("Could not check gift map. " + error.message);
			return result.reject(error);
		}
	);
	
	return result;
}