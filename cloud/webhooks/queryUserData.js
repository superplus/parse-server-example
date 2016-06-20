
function parseToPlain(queryResult) {
	var result = {};
	result.createdAt = queryResult.createdAt;
	result.updatedAt = queryResult.updatedAt;
	result.objectId = queryResult.id;
	for (var key in queryResult.attributes)
		result[key] = queryResult.attributes[key];
	return result;
}

function parsesToPlains(queryResults) {
	var result = [];
	for (var i = 0; i < queryResults.length; i++)
		result[i] = parseToPlain(queryResults[i]);
	return result;
}

function parseToSimple(queryResult) {
	var result = {};
	for (var key in queryResult.attributes)
		result[key] = queryResult.attributes[key];
	delete result.ACL;
	return result;
}

function parsesToSimples(queryResults) {
	var result = [];
	for (var i = 0; i < queryResults.length; i++)
		result[i] = parseToSimple(queryResults[i]);
	return result;
}


function findFromGuid(objects, guid) {
	if (guid === null || typeof guid === "undefined")
		return null;
	
	for (var i = 0; i < objects.length; i++)
		if (objects[i].guid == guid)
			return objects[i];
	
	return null;
}

function buildTree(user, profiles, settings, categories, items, resources)
{
	profiles = parsesToSimples(profiles);
	settings = parsesToSimples(settings);
	categories = parsesToSimples(categories);
	items = parsesToSimples(items);
	resources = parsesToSimples(resources);

	for (var i = 0; i < items.length; i++)
	{
		var category = findFromGuid(categories, items[i].categoryId);
		if (category === null)
			continue;
		
		items[i].Resource = findFromGuid(resources, items[i].resourceId);
		delete items[i].resourceId;
		items[i].Thumbnail = findFromGuid(resources, items[i].thumbnailId);
		delete items[i].thumbnailId;
		items[i].Sound = findFromGuid(resources, items[i].soundId);
		delete items[i].soundId;
		
		if (typeof category.Items === "undefined")
			category.Items = [];
		category.Items.push(items[i]);
		delete items[i].categoryId;
		delete items[i].relatedItemIds;
	}
	
	for (var i = 0; i < categories.length; i++)
	{
		var profile = findFromGuid(profiles, categories[i].profileId);
		if (profile === null)
			continue;
		
		delete categories[i].guid;
		delete categories[i].profileId;
		
		if (typeof profile.Categories === "undefined")
			profile.Categories = [];
		profile.Categories.push(categories[i]);
	}
	
	user.CurrentProfile = findFromGuid(profiles, user.profileId);

	for (var i = 0; i < profiles.length; i++)
	{
		profiles[i].Photo = findFromGuid(resources, profiles[i].photoId);
		if (profiles[i].Photo !== null)
			delete profiles[i].photoId;
		profiles[i].Settings = findFromGuid(settings, profiles[i].settingsId);
		if (profiles[i].Settings !== null)
		{
			delete profiles[i].Settings.profileId;
			delete profiles[i].Settings.guid;
			delete profiles[i].settingsId;
		}
		delete profiles[i].userId;
		delete profiles[i].guid;
	}

	user.Profiles = profiles;
	delete user.profileId;
	delete user.guid;
}

exports.get = function(req, res) {
	var username = req.params.username;
	var result = {};
	var invites = 0;
	var learningProgress = 0;

	if (username === undefined) {
		res.render('queryUserData', { username: "", data: "" });
		return;
	}

	new Parse.Query(Parse.User).equalTo('username', username).first({ useMasterKey: true })
		.then(function(user) {
			if (user === undefined) {
				return Parse.Promise.error(404);
			}
			return Parse.User.become(user.getSessionToken());
		}).then(function(user) {
			return Parse.Promise.when(
				user,
				new Parse.Query('Profile').find(),
				new Parse.Query('Settings').find(),
				new Parse.Query('Category').find(),
				new Parse.Query('Item').find(),
				new Parse.Query('Resource').find(),
				new Parse.Query('Tag').find()
			);
		}).then(function(user, profiles, settings, categories, items, resources, tags) {
			result.User = parseToSimple(user);
			buildTree(result.User, profiles, settings, categories, items, resources);
			
			result.Raw = {};
			result.Raw.User = parseToPlain(user);
			result.Raw.Profile = parsesToPlains(profiles);
			result.Raw.Settings = parsesToPlains(settings);
			result.Raw.Category = parsesToPlains(categories);
			result.Raw.Item = parsesToPlains(items);
			result.Raw.Resource = parsesToPlains(resources);
			result.Raw.Tag = parsesToPlains(tags);
			
		}).then(function(){
			var requestGenerator = require("cloud/functions/mixpanelRequest.js");
			var dateNow = new Date();
			var requestArgs ={	"where" : "properties[\"User\"]==\""+result.Raw.User.guid+"\"",
								"event" : "Invite Button Clicked",
								"to_date" : dateNow.getFullYear()+"-"+(dateNow.getMonth()+1)+"-"+dateNow.getDate(),
								"from_date" : result.Raw.User.createdAt.getFullYear()+"-"+(result.Raw.User.createdAt.getMonth()+1)+"-"+result.Raw.User.createdAt.getDate()
							}
			var request = requestGenerator.mixpanelRequest("http://mixpanel.com/api/2.0/segmentation/",requestArgs);
			return Parse.Cloud.httpRequest({ url: request });
		}).then(function(response) {
			var json = JSON.parse(response.text);
			for(var key in json.data.values["Invite Button Clicked"]){
				invites+=json.data.values["Invite Button Clicked"][key];
			}
		})/*.then(function(){
			var requestGenerator = require("cloud/functions/mixpanelRequest.js");
			var dateNow = new Date();
			var requestArgs ={	"where" : "properties[\"User\"]==\""+result.Raw.User.guid+"\"",
								"event" : "Learning module Task Completed",
								"to_date" : dateNow.getFullYear()+"-"+(dateNow.getMonth()+1)+"-"+dateNow.getDate(),
								"from_date" : result.Raw.User.createdAt.getFullYear()+"-"+(result.Raw.User.createdAt.getMonth()+1)+"-"+result.Raw.User.createdAt.getDate()
							}
			var request = requestGenerator.mixpanelRequest("http://mixpanel.com/api/2.0/segmentation/",requestArgs);
			return Parse.Cloud.httpRequest({ url: request });
		}).then(function(response) {
			var json = JSON.parse(response.text);
			for(var key in json.data.values["Learning module Task Completed"]){
				learningProgress+=json.data.values["Learning module Task Completed"][key];
			}
		}).then(function(){
			var requestGenerator = require("cloud/functions/mixpanelRequest.js");
			var dateNow = new Date();
			var requestArgs ={	"where" : "properties[\"User\"]==\""+result.Raw.User.guid+"\"",
								"event" : "Learning module Task Reset",
								"to_date" : dateNow.getFullYear()+"-"+(dateNow.getMonth()+1)+"-"+dateNow.getDate(),
								"from_date" : result.Raw.User.createdAt.getFullYear()+"-"+(result.Raw.User.createdAt.getMonth()+1)+"-"+result.Raw.User.createdAt.getDate()
							}
			var request = requestGenerator.mixpanelRequest("http://mixpanel.com/api/2.0/segmentation/",requestArgs);
			return Parse.Cloud.httpRequest({ url: request });
		}).then(function(response) {
			var json = JSON.parse(response.text);
			for(var key in json.data.values["Learning module Task Reset"]){
				learningProgress-=json.data.values["Learning module Task Reset"][key];
			}
		})*/.then(function() {
			console.log("invites: "+invites+", learningProgress: "+learningProgress);
			res.render('queryUserData', { username: username, data: JSON.stringify(result),invites: invites,learningProgress:learningProgress, success: "User found!" });
		}
		,
		function(error) {
			if(error=404)
				res.render('queryUserData', { error: "User not found!", username: username });
			else
				res.render('queryUserData', { error: "Can't get or parse data from Parse server"+(typeof error === 'number' ? ". Error code: "+error : ""),username: "" })
		});
};
