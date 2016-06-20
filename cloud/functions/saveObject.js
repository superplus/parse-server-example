Sharing = require("cloud/Sharing.js");
Slack = require("cloud/slack.js");

var getRole = function(user, roleName) {

    if (roleName === undefined || roleName == null)
        return Parse.Promise.as(undefined);

    return new Parse.Query(Parse.Role).equalTo("name", roleName).first()
    .then(function(result) {
        if (result !== undefined)
            return result;

        var acl = new Parse.ACL(user);
        acl.setPublicReadAccess(true);
        var role = new Parse.Role(roleName, acl);

        // The save can fail if a role was created by someone else asynchronously
        return role.save()
                    .fail(function(error) { 
                        return new Parse.Query(Parse.Role).equalTo("name", roleName).first();
                    });
    })
}


exports.main = function(request, response) {


    var type = request.params.type;
    var guid = request.params.guid;
    
	var ownerProfile = request.params.ownerProfile;
    var user = request.user;
    var role;

    var objectQuery = new Parse.Query(type).equalTo("guid", guid).first();

    var roleQuery = getRole(user, ownerProfile);

    Parse.Promise.when(objectQuery, roleQuery).then(function(resultObject, resultRole) {
        // If the object is not created, we have to create it with the correct permissions
        if (resultObject === undefined)
        {
            resultObject = new Parse.Object(type);
            var acl;

            if (resultRole === undefined)
                acl = new Parse.ACL(user);
            else
            { 
                acl = new Parse.ACL(resultRole.getACL().toJSON());
                acl.setPublicReadAccess(false);
                acl.setRoleReadAccess(resultRole, true);
				
//				if (resultRole.getName() == guid) // Tests whether the object is a Profile
//					acl.setRoleWriteAccess(resultRole, false);
//				else
                // Let users the profile is shared with update info as well
				acl.setRoleWriteAccess(resultRole, true);
            }

            resultObject.setACL(acl);
        }
        
        var subscriptions;

        for (var key in request.params.object)
        {
            var property = request.params.object[key];
            if (type == 'User' && 
                key == 'subscriptions'){
                subscriptions = property;
            }
            if( type == 'User' && key == 'email') {
                var slack = new Slack();
      
                slack.send({text: "New SuperSpeak user registered: " + property , channel: "#usagestats"}).then(function(){
                  console.log('success sending new user registration sending to slack');
                }, function(error){
                  console.log('error sending new user registration to slack: ' + error );
                });
            }
            resultObject.set(key, property);
        }

        if (subscriptions === undefined || subscriptions.length == 0){
            return resultObject.save();
        }
        else{
            return Sharing.addInviteReward(subscriptions, user.get('email'))
                .then(function(result){
                    return resultObject.save();
                },
                function(error){
                    return error;
                });
        }
    }).then(function(savedResult) {
        response.success(savedResult);
    },

    function(error) {
        response.error(error);
    });      
}

