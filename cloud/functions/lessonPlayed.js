
exports.main = function(request, response) {
    var lessonId = request.params.lessonId;

    Parse.Cloud.useMasterKey();
    
    new Parse.Query("Lesson").equalTo("guid", lessonId).each(function(lesson) {
    	lesson.increment("playCount", 1);
    	return lesson.save();
    }).then(function(){
		response.success({ });
    })
}