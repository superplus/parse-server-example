Slack = require("cloud/slack.js");

exports.main = function(request, response) {

    var userPromise = new Parse.Query(Parse.User).equalTo("username", request.params.toUsername).first({ useMasterKey: true });
    var rolePromise = new Parse.Query(Parse.Role).equalTo("name", request.params.profileId).first({ useMasterKey: true });
    var slack = new Slack();

    Parse.Promise.when(userPromise, rolePromise)
    .then(function(user, role) {
        if (user === undefined)
            return Parse.Promise.error(new Parse.Error(Parse.Error.EMAIL_NOT_FOUND, "Email '" + request.params.toUsername + "' not found."));
        if (role === undefined)
            return Parse.Promise.error(new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, "Role '" + request.params.profileId + "' not found. Perhaps the associated Profile has not yet been uploaded?"));

        if (request.params.isShared){
            console.log("SHARING");

            slack.send({text: request.user.get("email") + ' shared profile to ' + request.params.toUsername , channel: "#usagestats"}).then(function(re){
                console.log('Success sending profile sharing message to slack');
            }, function(error){
                console.log('Error sending profile sharing message to to slack' + error );
            });

            role.getUsers().add(user);
            role.save(null, { useMasterKey: true, wait: true });
            var params = 
                {
                    key: 'UJNOUhE5FDGYezERQyx3Ew',
                    template_name: 'On Share',
                    template_content: [{name:"test", content:"test"}],
                    message: {
                        to:[{email:request.params.toUsername}],
                        global_merge_vars: [
                        {
                            name: "SHARER_NAME",
                            content: request.user.get("name")
                        },
                        {
                            name: "PROFILE_NAME",
                            content: request.params.profileName
                        },
                        {
                            name: "RECEIVER_EMAIL",
                            content: request.params.toUsername
                        },
                        {
                            name: "PROFILE_ID",
                            content: request.params.profileId
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
                    response.success();
                },
                error: function(r){
                    console.log("ERROR");
                    console.log(r);
                    response.success();
                }
            });
        }
        else{
            role.getUsers().remove(user);
            role.save(null, { wait: true, useMasterKey: true });
            response.success();
        }
    },
    function(error) {
        response.error(error);
    });
}