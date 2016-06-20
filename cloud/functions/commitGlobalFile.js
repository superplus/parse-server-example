
exports.main = function(request, response) {
    
    var query = new Parse.Query("GlobalFile")
        .equalTo("fileName", request.params.fileName)
        .first()
        .then(function(file) {
            if (file === undefined)
            {
                file = new Parse.Object("GlobalFile");
                file.set("fileName", request.params.fileName);
                var acl = new Parse.ACL(request.user);
                acl.setPublicReadAccess(true);
                file.setACL(acl);
            }
            
            file.set("file", { name: request.params.remoteName, url: request.params.url, __type: "File" });
            return file.save();
        }).then(function(file) {
            response.success(file);
        }, 
        function(error) {
            response.error(error);
        });
};