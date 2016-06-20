var makePublic = function(object){
    var acl = new Parse.ACL(object.getACL().toJSON());
    acl.setPublicReadAccess(true);
    object.setACL(acl);
    return object.save();
}

var makeResourcesPublic = function(resourceIds){
    var q = new Parse.Query("Resource")
        .containedIn("guid", resourceIds)
        .each(function(resource){
            resource.set("isPublic", true);
            return makePublic(resource);
        });

    return q;
}

exports.main = function(request, status) {
    Parse.Cloud.useMasterKey();
    
    new Parse.Query("Lesson").equalTo("access", "pending_public").each(function(lesson) {
        var resourceIds = [];
        var promises = [];
        var lessonId = lesson.get("guid");
        lesson.set("access", "public");
        promises.push(makePublic(lesson));

        if (lesson.has("promoPhoto")){
            resourceIds.push(lesson.get("promoPhoto").guid);
        }

        var taskQuery = new Parse.Query("LessonTask")
            .equalTo("lessonId", lessonId)
            .each(
                function(task){
                    var taskId = task.get("guid");

                    if (task.has("soundId")){
                        resourceIds.push(task.get("soundId"));
                    }
                    if (task.has("rewardSoundId")){
                        resourceIds.push(task.get("rewardSoundId"));
                    }
                    if (task.has("imageResources")){
                        var rawList = task.get("imageResources");
                        for (var j = 0; j < rawList.length; j++){
                            resourceIds.push(JSON.parse(rawList[j]).guid);
                        }
                    }
                    return makePublic(task);
                }
            );
        
        promises.push(taskQuery);
        
        return Parse.Promise.when(promises).then(function(){
            return makeResourcesPublic(resourceIds);
        });
    })
    .then(function() {
        console.log("Approve pending lessons done!");
        status.success();
    },
    function(error) {
        status.error("We got a crash... buhu");
    });
}