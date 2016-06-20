
function simplify(object) {
	if (Array.isArray(object)) {
		var results = [];
		for (var i = 0; i < object.length; i++)
			results[i] = simplify(object[i]);
		return results;
	}
	else
	{
		var result = {};
		for (var key in object.attributes)
			result[key] = object.attributes[key]
		delete result.objectId;
		delete result.ACL;
		return result;
	}
}

function cloneUser(object) {
	object.username = "c_" + object.username;
	object.email = "c_" + object.email;
	object.name = object.name
	object.password = "Sup3rplus";

	return Parse.Cloud.httpRequest({
		url: "https://api.parse.com/1/users",
		method: "POST",
		headers: {
				'X-Parse-Application-Id': "iDXyTtt6QDcTq2CPRApGrTz05daEJkJVuTXiWqrL",
				'X-Parse-REST-API-Key': "iNBR9IAnBdLerPn4cvsw7PXtu4OU2UWH6oAiJifk",
				'Content-Type': "application/json"
			},
		body: object
	});
}

function cloneObjects(cls, objects, acl, sessionToken) {
	var promises = new Array(objects.length);
	
	console.log(">> Cloning " + objects.length + " objects of type " + cls);
	
	for (var i = 0; i < objects.length; i++) {
		var object = objects[i];
		object.ACL = acl;
		
		promises[i] = Parse.Cloud.httpRequest({
			url: "https://api.parse.com/1/classes/" + cls,
			method: "POST",
			headers: {
				'X-Parse-Application-Id': "iDXyTtt6QDcTq2CPRApGrTz05daEJkJVuTXiWqrL",
				'X-Parse-REST-API-Key': "iNBR9IAnBdLerPn4cvsw7PXtu4OU2UWH6oAiJifk",
				'X-Parse-Session-Token': sessionToken,
				'Content-Type': "application/json"
			},
			body: object
		});
		
	}
	
	return Parse.Promise.when(promises);
}


function cloneResources(resources, acl, sessionToken) {
	var promises = new Array(resources.length);

	for (var i = 0; i < resources.length; i++) {
		promises.push(
			Parse.Promise.as(i) // This essentially curries i, in order to ensure consistency for all callbacks in each Promise chain
				.then(function(index) {
					return Parse.Cloud.httpRequest({
						url: resources[index].file._url,
						method: "GET",
					})
					.then(function(httpResponse) {
						return Parse.Cloud.httpRequest({
							url: "https://api.parse.com/1/files/" + resources[index].guid + "." + resources[index].extension,
							method: "POST",
							headers: {
								'X-Parse-Application-Id': "iDXyTtt6QDcTq2CPRApGrTz05daEJkJVuTXiWqrL",
								'X-Parse-REST-API-Key': "iNBR9IAnBdLerPn4cvsw7PXtu4OU2UWH6oAiJifk",
								'Content-Type': httpResponse.headers['Content-Type']
							},
							body: httpResponse.buffer
						});
					})
					.then(function(httpResponse) {
						var newFile = httpResponse.data;
						resources[index].file = { __type: "File", name: newFile.name, url: newFile.url };
					});
				})
			);
	}
	
	
	return Parse.Promise.when(promises)
		.then(function() {
			return cloneObjects('Resource', resources, acl, sessionToken);
		});
}


exports.get = function(req, res) {
	var username = req.params.username;
	res.render('cloneUser', { username: username || "", hostname: req.host });
};


exports.post = function(req, res) {
	var username = req.body.username;

	new Parse.Query(Parse.User).equalTo('username', username).first({ useMasterKey: true })
		.then(function(user) {
			if (user === undefined)
				return Parse.Promise.error(404);
			
			return Parse.User.become(user.getSessionToken());
		})
		.then(function(user) {
			var acl = new Parse.ACL(user);
			user.setACL(acl);
			user.save({ wait: true });
		
			console.log(user);
			return cloneUser(simplify(user));
		}).then(function(user) {
			return Parse.Promise.when(
				user,
				new Parse.Query('Profile').find(),
				new Parse.Query('ExtendedProfile').find(),
				new Parse.Query('Settings').find(),
				new Parse.Query('Category').find(),
				new Parse.Query('Item').limit(1000).find(),
				new Parse.Query('Resource').limit(1000).find(),
				new Parse.Query('Tag').find()
			);
		})
		.then(function(clonedUser, profiles, extendedProfiles, settings, categories, items, resources, tags) {
			clonedUser = clonedUser.data;
			var sessionToken = clonedUser.sessionToken;
			var acl = {};
			acl[clonedUser.objectId] = { read: true, write: true };
			
			return cloneResources(simplify(resources), acl, sessionToken)
				.then(function() {
					return Parse.Promise.when([
						cloneObjects('Profile', simplify(profiles), acl, sessionToken),
						cloneObjects('ExtendedProfile', simplify(extendedProfiles), acl, sessionToken),
						cloneObjects('Settings', simplify(settings), acl, sessionToken),
						cloneObjects('Category', simplify(categories), acl, sessionToken),
						cloneObjects('Item', simplify(items), acl, sessionToken),
						cloneObjects('Tag', simplify(tags), acl, sessionToken),
					]);
				});
		})
		.then(function() {
			console.log("Operation was successful");
			res.send(200);
		},
		function(error) {
			if (typeof error === 'int')
				res.send(error);
			else
				res.send(500, error);
		});
};