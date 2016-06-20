
exports.main = function(request, response) {
    
    var query = new Parse.Query("GlobalImage")
        .equalTo("fileName", request.params.fileName)
        .first()
        .then(function(file) {
            if (file === undefined)
            {
                file = new Parse.Object("GlobalImage");
                file.set("fileName", request.params.fileName);
                var acl = new Parse.ACL(request.user);
                acl.setPublicReadAccess(true);
                file.setACL(acl);
            }
            
            file.set("file1x", { name: request.params.name1x, url: request.params.url1x, __type: "File" });
            file.set("file2x", { name: request.params.name2x, url: request.params.url2x, __type: "File" });
            file.set("file4x", { name: request.params.name4x, url: request.params.url4x, __type: "File" });
            return file.save();
        }).then(function(file) {
            response.success(file);
        }, 
        function(error) {
            response.error(error);
        });
};