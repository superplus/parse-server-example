MailChimp = require("cloud/Mailchimp.js");

var addToTrialList = function(request, callback){
    MailChimp.listsSubscribe({
        id: "80941d5ba1",
        email: { email: request.object.get('email') },
        merge_vars: { FNAME: request.object.get('name') },
        double_optin: false,
        success: function() { console.log(">>> Subscribed successfully"); callback(); },
        error: function(httpResponse) { console.error("Attempting to subscribe to MailChimp list with id '80941d5ba1' failed with: " + JSON.stringify(httpResponse)); callback(); }
    });
}

var addToSubscribersList = function(request, callback){
    MailChimp.listsSubscribe({
        id: "194c96d71f",
        email: { email: request.object.get('email') },
        merge_vars: { FNAME: request.object.get('name') },
        double_optin: false,
        success: callback,
        error: function(httpResponse) { console.error("Attempting to subscribe to MailChimp list with id '194c96d71f' failed with: " + JSON.stringify(httpResponse)); callback(); }
    });
}

var removeFromTrialList = function(request, response){
    MailChimp.listsUnsubscribe({
        id: "80941d5ba1",
        email: { email: request.object.get('email') },
        success: function(){addToSubscribersList(request, response.success);},
        error: function(httpResponse){addToSubscribersList(request, response.success);}
    });
}


exports.addToSubscribersList = addToSubscribersList;
exports.addToTrialList = addToTrialList;
exports.removeFromTrialList = removeFromTrialList;