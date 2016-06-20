exports.main = function(request, response) {
    new Parse.Query(Parse.User).equalTo("username", request.params.username).first({
        useMasterKey: true,
        success: function(user) {
            if (user !== undefined)
                response.success({userexist:true, objectId:user.id, ACL:new Parse.ACL(request.user)});
            else
                response.success({userexist:false});
        },
        error: function(error) {
            response.error(error);
        }
    });
}
