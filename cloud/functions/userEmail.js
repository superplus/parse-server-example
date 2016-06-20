exports.main = function(request, response) {
    new Parse.Query(Parse.User).containedIn("objectId", request.params.objectIds).find({
        useMasterKey: true,
        success: function(users) {
            var res = [];
            for (var i = 0; i < users.length; i++){
                res.push({objectId: users[i].id, email: users[i].get('username')});
            }
            response.success(res);
        },
        error: function(error) {
            response.error(error);
        }
    });
}
