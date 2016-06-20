exports.main = function (request, status) {
    Parse.Cloud.useMasterKey()
    new Parse.Query(Parse.User).get("lGwPz6MPC4", function(resultUser){
        console.log("Got user " + resultUser.toString());
        new Parse.Query(Parse.Role).get(
            "LLcK8bTSVz",
            function(resultRole) {
                console.log("Got role " + resultRole.toString());
                var id = resultRole.get("name");
                resultRole.getUsers().add(resultUser);
                resultRole.save();
            }
        )
        .then(
            function() {
                status.success();
            },
            function(error) {
                status.error("We got a crash");
            }
        );
    });
}
