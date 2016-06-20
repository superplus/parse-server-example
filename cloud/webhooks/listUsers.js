
var moment = require('moment');

exports.get = function(req, res) {
	var attributes = req.query;
	var query = new Parse.Query(Parse.User);
	var page = req.params.page;
	var searchQuery = req.params.query;
	if(page === undefined){
		page = 1;
	}
	if(searchQuery !== undefined){
		query.matches("username",".*"+searchQuery+".*");
		var nameQuery = new Parse.Query(Parse.User);
		nameQuery.matches("name",".*"+searchQuery+".*");
		query = Parse.Query.or(query,nameQuery);
	}
	if(attributes["sortField"]===undefined || attributes["sortType"]===undefined){
		attributes["sortField"]="username";
		attributes["sortType"]="asc";
	}
	if(attributes["sortType"]=="asc"){
		query.ascending(attributes["sortField"])
	}else if(attributes["sortType"]=="dsc"){
		query.descending(attributes["sortField"])
	}else{
		query.ascending("username");
	}
	var requiredProperties = [];
	for(var key in attributes){
		if(key!="sortField" && key!="sortType"){
			query.exists(key);
			requiredProperties[requiredProperties.length]=key;
		}
	}

	query.count({
		success:function(count){
			if(page<1){
				page=1;
			}else if(page>Math.ceil(count/20)){
				page=Math.ceil(count/20);
			}
			query.limit(20)
			query.skip((page-1)*20)
			query.find({
				success:function(users){
					var userList=[]
					var i;
					for(i=0;i<users.length;i++){
						var trialPeriodLength = users[i].get('trialPeriodLength') || 14;
						var endDate = moment.utc(users[i].createdAt).add('days', trialPeriodLength).startOf('day');
						var daysLeft = endDate.diff(moment.utc().startOf('day'), 'days');

						var subscriptions = users[i].get("subscriptions");
						subscriptions = typeof subscriptions === "undefined" ? [] : subscriptions

						userList[userList.length]={ username : users[i].getUsername(), name : users[i].get("name"), trialPeriodLeft: (daysLeft>0 ? daysLeft : 0), hasSubscription: (subscriptions.length>0)}
					}
					res.render('listUsers',{title: "List of users",userList:userList,count:count,page:page,query:searchQuery,sortField:attributes["sortField"],sortType:attributes["sortType"],requiredProperties:requiredProperties});
					return;
				},
				error:function(error){
					res.render('listUsers',{error:"Error when fetching users"});
					return;
				},
				useMasterKey:true
			});
		},
		error:function(errer){
			res.render('listUsers',{error:"Error when counting users"});
			return;
		},
		useMasterKey:true
	})
}