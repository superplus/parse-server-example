
exports.main = function(request, response) {

    new Parse.Query(request.params.type)
        .equalTo("guid", request.params.guid)
        .first(function(result) {
            if (result === undefined)
                response.success("Object is already deleted.");
            else
            {
                result.destroy({ wait: true });
                response.success();
            }
        },
        function(error) {
            response.error(error);
        }
    );
}