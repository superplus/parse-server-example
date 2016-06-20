
exports.get = function(req, res) {

	var requestGenerator = require("cloud/functions/mixpanelRequest.js");

	var date = new Date();
	var endDay = date.getDate();
	var endYear = date.getFullYear();
	var endMonth = date.getMonth()+1;

	startDate = new Date (date.getTime() - (6*7*24*60*60*1000) );

	var startDay = startDate.getDate();
	var startYear = startDate.getFullYear();
	var startMonth = startDate.getMonth()+1;

	var endDate = endYear + '-' + endMonth + '-' + endDay;
	var startDate = startYear + '-' + startMonth + '-' + startDay;


	if( req.params.page == 'retention') {
		var requestArgs ={	"to_date" : endDate,
							"from_date" : startDate,
							born_event: "User Created",
						  	unit: "week",
						  	interval_count: 4
						}
		var request = requestGenerator.mixpanelRequest("http://mixpanel.com/api/2.0/retention",requestArgs);
		Parse.Cloud.httpRequest({
			url: request,
			success: function(httpResponse) {
				var json = JSON.parse(httpResponse.text);
				var data = json;
				var firsts = [0,0,0,0,0];
				var retentions = [0,0,0,0,0];

				for ( week in data ) {
					weekObject = data[week];
					for( var i = 0; i < weekObject.counts.length; i++ ) { 
						retentions[i]+=weekObject.counts[i];
						firsts[i]+=weekObject.first;
					}
				}
				var d1 = (retentions[0]/firsts[0]);
				var d7 = (retentions[1]/firsts[1]);
				var d14 = (retentions[2]/firsts[2]);
				var d30 = (retentions[4]/firsts[4]);

				res.set('Content-Type', 'application/json');
				res.render("analyticsWeb", { d1: d1, d7 : d7, d14 : d14, d30 : d30});
				//res.render('testMixpanel',{title: "This is a mixpanel testing page",success:"Got data from mixpanel("+request+"): "+httpResponse.text});
			},
			error: function(httpResponse) {
			}
		});
	} else if( req.params.page == 'conversion') {
		var requestArgs ={	"to_date" : endDate,
							"from_date" : startDate,
							event: "User Created",
							type: "unique"
						}
		var count = 0;
		var subscribtions = 0;
		
		var request = requestGenerator.mixpanelRequest("http://mixpanel.com/api/2.0/segmentation",requestArgs);

		console.log('top of console!');
		Parse.Cloud.httpRequest({
			url: request,
			success: function(httpResponse) {
				
				var json = JSON.parse(httpResponse.text);
				var data = json;
				
				var allEvents = data.data.values['User Created'];
				for ( day in allEvents ) {
					count += allEvents[day];
				}

				var requestArgsSegmentation ={	"to_date" : endDate,
							"from_date" : startDate,
							event: "Subscribe Purchase Completed",
							type: "unique"
						}
				var request = requestGenerator.mixpanelRequest("http://mixpanel.com/api/2.0/segmentation",requestArgsSegmentation);
				
				

				Parse.Cloud.httpRequest({
					url: request,
					success: function(httpResponse) {
						var json = JSON.parse(httpResponse.text);
						var data = json;
						
						var allEvents = data.data.values['Subscribe Purchase Completed'];
						
						for ( day in allEvents ) {
							subscribtions += allEvents[day];
						}

						var percentage  = (subscribtions / count * 100 ).toFixed( 2 );

						res.set('Content-Type', 'application/json');
						res.render("analyticsWebConversion", { percentage : percentage, users: count, subscribtions: subscribtions });
					},
					error: function(httpResponse) {
					}
				});

			},
			error: function(httpResponse) {
				console.log('error: ' + httpResponse);
			}
		});

	}

	
};
