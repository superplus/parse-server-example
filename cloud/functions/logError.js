
exports.main = function(request, response) {
    var errorMessage = request.params.errorMessage;
    if (request.user == null)
        console.error("A client threw an exception for undefined user with:\n" + errorMessage);
    else
        console.error("A client threw an exception for user " + request.user.id + " (" + request.user.get("email") + ") with:\n" + errorMessage);
    response.success();
};