
var moment = require('moment');

exports.get = function(req, res) {
	var attributes = req.query;
	var query = new Parse.Query("PromoCodes");
	var page = req.params.page;
	var searchQuery = req.params.query;
	var generateCode = function guid() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000)
		      .toString(16)
		      .substring(1);
		  }
		  return String(s4() + s4()).substring(0, 6);
		};

	if(page === undefined){
		page = 1;
	}
	if(searchQuery !== undefined){
		query.matches("name",".*"+searchQuery+".*");
		var nameQuery = new Parse.Query("PromoCodes");
		nameQuery.matches("promoCode",".*"+searchQuery+".*");
		query = Parse.Query.or(query,nameQuery);
	}
	if(attributes["sortField"]===undefined || attributes["sortType"]===undefined){
		attributes["sortField"]="createdAt";
		attributes["sortType"]="dsc";
	}
	if(attributes["sortType"]=="asc"){
		query.ascending(attributes["sortField"])
	}else if(attributes["sortType"]=="dsc"){
		query.descending(attributes["sortField"])
	}else{
		query.ascending("name");
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
				success:function(promocodes){
					var promocodeList=[]
					var i;
					for(i=0;i<promocodes.length;i++){
						promocodeList[promocodeList.length] = {
							createdAt : promocodes[i].createdAt,
							name : promocodes[i].get("name"),
							promoCode: promocodes[i].get("promoCode"), 
							handout: promocodes[i].get("handout"), 
							endsAt: new Date(promocodes[i].get("endsAt")), 
							count: promocodes[i].get("count"), 
							used: promocodes[i].get("used")
						}
					}
					res.render('promocodes',{title: "List of promo codes",promocodeList:promocodeList,count:count,page:page,query:searchQuery,sortField:attributes["sortField"],sortType:attributes["sortType"],requiredProperties:requiredProperties,generateCode:generateCode});
					return;
				},
				error:function(error){
					res.render('promocodes',{error:"Error when fetching promocodes"});
					return;
				},
				useMasterKey:true
			});
		},
		error:function(errer){
			res.render('promocodes',{error:"Error when counting promocodes"});
			return;
		},
		useMasterKey:true
	})
}

exports.put = function(req, res) {
	Parse.Cloud.useMasterKey();

	var PromoCodes = Parse.Object.extend("PromoCodes");
	var promoCode = new PromoCodes();

	promoCode.set("name", req.params.name);
	promoCode.set("promoCode", req.params.promoCode);
	promoCode.set("handout", req.params.handout);
	promoCode.set("endsAt", new Date(req.params.endsAt));
	promoCode.set("count", parseInt(req.params.count));
	promoCode.set("used", 0);

	promoCode.save(null, {
		success: function(promoCode){
			alert("Promo code " + promoCode.get("name") + " created");
			res.send(200);
		},
		error: function(promoCode, error){
			alert("Failed to create promo code " + promoCode.get("name") + ": " + error.message);
			res.send(500, error);
		}
	});
};
