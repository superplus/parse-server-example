
exports.main = function(request, response) {
	var objects = request.params.objects;
	var deletePromises = [];

	for (var i = 0; i < objects.length; i++)
	{
		var query = new Parse.Query(objects[i].type).equalTo("guid", objects[i].guid);
		deletePromises[i] = query.first();
	}
	
	Parse.Promise.when(deletePromises).then(
		function() {
			var c = 0;
			var toDestroy = [];
			for (var i = 0; i < arguments.length; i++)
			{
				if (arguments[i] !== undefined)
					toDestroy[c++] = arguments[i];
			}
	
			return Parse.Object.destroyAll(toDestroy);
		}
	).then(
		function() {
			response.success("All deletes succeeded");
		},
		function(error) {
			if (error.code == Parse.Error.AGGREGATE_ERROR) {
				response.success("Some deletes failed"); // Some deletes failed, e.g. if they were already deleted. We don't care.
			} else {
				response.error(error);
			}
		});
}