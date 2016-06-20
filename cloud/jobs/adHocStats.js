exports.main = function(request, status) {
    Parse.Cloud.useMasterKey();
    var startDate = new Date(2015, 5, 0);
    var endDate = new Date(2015, 6, 13);

    console.log("Start at " + startDate.getTime());
    console.log("End at " + endDate.getTime());

    var numOpenedMoreThanFiveDays = 0;
    var numOpenedAfterTrialEnded = 0;

    new Parse.Query(Parse.User).each(function(resultUser) {
        var userCreated = resultUser.createdAt;
        
        if (userCreated.getTime() >= startDate.getTime() && userCreated.getTime() <= endDate.getTime()){
            var offerTriggers = resultUser.get("offerTriggers");
            if (offerTriggers != null){
                for (var i = 0; i < offerTriggers.length; i++){
                    if (offerTriggers[i] == "trialended1"){
                        numOpenedAfterTrialEnded++;
                    }
                }
            }
        }
    })
    .then(function() {
        console.log("Opened more than five days " + numOpenedMoreThanFiveDays);
        console.log("Opened after trial ended " + numOpenedAfterTrialEnded);
        status.success();
    },
    function(error) {
        status.error("We got a crash");
    });
}