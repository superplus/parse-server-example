
exports.main = function(request, response) {
	var date = new Date();
	response.success({ date: date });
}