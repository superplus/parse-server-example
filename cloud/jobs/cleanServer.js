
var profileExists = function(guid) {
    return new Parse.Query("Profile")
        .equalTo("guid", guid)
        .count(function(n) {
            return n > 0;
        });
};

var deleteWhereHasNoProfile = function(typename) {
    console.log("Deleting all profileless " + typename + " objects...");
    var count = 0;
    return new Parse.Query(typename).each(function(result) {
        return profileExists(result.profileId)
            .then(function(exists) {
                if (!exists)
                {
                    count += 1;
                    return result.destroy();
                }
        });
    }).then(function() {
        console.log("Deleted " + count + " " + typename + " objects.");
    });
};

exports.main = function(request, status) {
    Parse.Cloud.useMasterKey();

    new Parse.Query("Profile").each(function(result) {
        var userId = result.get("userId");
        return new Parse.Query("User")
            .equalTo("guid", userId)
            .count(function(n) {
                if (n == 0)
                    return result.destroy();
            });
    })
    .then(deleteWhereHasNoProfile("Category"))
    .then(deleteWhereHasNoProfile("Settings"))
    .then(deleteWhereHasNoProfile("Tag"))
    .then(deleteWhereHasNoProfile("Resource"))

    .then(function() {
        status.success();
    },
    function(error) {
        status.error("We got a crash");
    });

/*
    new Parse.Query(request.params.type)
        .equalTo("guid", request.params.guid)
        .first(function(result) {
            if (result === undefined)
            {
                response.success("Object is already deleted.");
                return;
            }

            return result.destroy();
        })
        .then(function() {
            response.success();
        },
        function(error) {
            response.error(error);
        }
    );
*/
}