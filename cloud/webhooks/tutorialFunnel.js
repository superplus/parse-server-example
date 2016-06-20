exports.get = function(req, res) {
	var requestGenerator = require("cloud/functions/mixpanelRequest.js");
	var dateNow = new Date();
	var requestArgs ={	"api_key" : "a0e9a52ce60af86598d765d5d2b81e59",
					"funnel_id" : "1018309",
					"to_date" : dateNow.getFullYear()+"-"+(dateNow.getMonth()+1)+"-"+dateNow.getDate(),
					"interval" : "61" };
	var dateOld = new Date(dateNow.getTime()-1000*60*60*24*60);
	requestArgs["from_date"]=dateOld.getFullYear()+"-"+(dateOld.getMonth()+1)+"-"+dateOld.getDate()
	var request = requestGenerator.mixpanelRequest("http://mixpanel.com/api/2.0/funnels",requestArgs);
	Parse.Cloud.httpRequest({
		url: request,
		success: function(httpResponse) {
			var response = JSON.parse(httpResponse.text);
			var data = response.data[response.meta["dates"][0]];
			console.log(data["analysis"])
			res.render('tutorialFunnel',{title: "Tutorial funnel", analysis:data["analysis"], steps:data["steps"]});
		},
		error: function(httpResponse) {
			res.render('tutorialFunnel',{title: "Error!",error:"Error fetching data from mixpanel"});
		}
	});
}