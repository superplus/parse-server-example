

exports.main = function(request, response) {
    var query = new Parse.Query("GlobalSettings");
    query.find(
        function(settings) {
            var result = {};
            for (var i = 0; i < settings.length; i++)
                result[settings[i].get("name")] = settings[i].get("value");
            
            response.success(result);
        },
        function(error) {
            response.error(error);
        }
    );
}