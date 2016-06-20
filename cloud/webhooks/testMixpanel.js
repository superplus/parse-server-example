exports.get = function(req, res) {
	var requestGenerator = require("cloud/functions/mixpanelRequest.js");
	var dateNow = new Date();
	var requestArgs ={	"where" : "properties[\"User\"]==\"_4TDKYvuHtNA4HNLrJ3EnWA\"",
						"event" : "Invite Button Clicked",
						"to_date" : dateNow.getFullYear()+"-"+(dateNow.getMonth()+1)+"-"+dateNow.getDate(),
						"from_date" : "2014-04-16"
					}
	//var dateFrom = new Date(dateNow.getTime()-1000*60*60*24*120);
	//requestArgs["from_date"]=dateFrom.getFullYear()+"-"+(dateFrom.getMonth()+1)+"-"+dateFrom.getDate()
	var request = requestGenerator.mixpanelRequest("http://mixpanel.com/api/2.0/segmentation",requestArgs);
	Parse.Cloud.httpRequest({
		url: request,
		success: function(httpResponse) {
			var json = JSON.parse(httpResponse.text);
			var sum = 0;
			for(var key in json.data.values["Invite Button Clicked"]){
				//console.log(key+": "+json.data.values["Subscribe Viewed"][key]);
				sum+=json.data.values["Invite Button Clicked"][key];
			}
			console.log(sum);
			res.render('testMixpanel',{title: "This is a mixpanel testing page",success:"Got data from mixpanel("+request+"): "+httpResponse.text});
		},
		error: function(httpResponse) {
			res.render('testMixpanel',{title: "Error!",error:"Error fetching data from mixpanel: "+request+" "+httpResponse.text});
		}
	});
}
					