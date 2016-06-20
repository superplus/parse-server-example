
exports.main = function(request, response) {
    var userPromise = new Parse.Query(Parse.User).equalTo("username", request.params.toUsername).first({ useMasterKey: true });
    var rolePromise = new Parse.Query(Parse.Role).equalTo("name", request.params.profileId).first();

    Parse.Promise.when(userPromise, rolePromise)
    .then(function(user, role) {
        if (user === undefined)
            return Parse.Promise.error(new Parse.Error(Parse.Error.EMAIL_NOT_FOUND, "Email '" + request.params.toUsername + "' not found."));
        if (role === undefined)
            return Parse.Promise.error(new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, "Role '" + request.params.profileId + "' not found. Perhaps the associated Profile has not yet been uploaded?"));

        if (request.params.isShared)
            role.getUsers().add(user);
        else
            role.getUsers().remove(user);
        role.save({ wait: true });

        response.success();
    },
    function(error) {
        response.error(error);
    });
}