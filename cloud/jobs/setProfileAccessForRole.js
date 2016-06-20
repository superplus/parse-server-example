exports.main = function(request, status) {
    Parse.Cloud.useMasterKey();

    new Parse.Query(Parse.Role).each(function(resultRole) {
        var id = resultRole.get("name");
        var q = new Parse.Query("Profile")
            .equalTo("guid", id)
            .find({ useMasterKey:true, wait:true })
            .then(
                function(profiles){
                    for (var i = 0; i < profiles.length; i++){
                        var profile = profiles[i];
                        if (profile !== undefined){
                            acl = new Parse.ACL(profile.getACL().toJSON());
                            acl.setRoleReadAccess(resultRole, true);
                            acl.setRoleWriteAccess(resultRole, true);
                            profile.setACL(acl);
                            profile.save(null, {wait:true});
                        }
                    }
                }
            );
    })
    .then(function() {
        status.success();
    },
    function(error) {
        status.error("We got a crash");
    });
}