

exports.main = function(request, response) {
    var guid = request.params.guid;

    if (guid === undefined)
    {
        response.error("Invalid input object");
        return;
    }

    new Parse.Query("Resource").equalTo("guid", guid).first()
		.then(function(result) {
        if (result === undefined)
        {
            return Parse.Promise.error("Did not find a resource with the requested guid");
        }
        else
        {
            return Parse.Cloud.httpRequest({
                url: result.get("file").url(),
                method: "GET"
            });
        }
    }).then(function(httpResponse) {
        response.success(httpResponse.buffer);
    },

    function(error) {
        response.error(error);
    });
};