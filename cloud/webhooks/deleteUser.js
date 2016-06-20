exports.get = function(req, res) {
	var username = req.params.username;
	var confirmed = req.params.confirmed;
	var result = {};

	var token;

	if (username === undefined) {
		res.render('deleteUser', { username: "", data: "" });
		return;
	}

	new Parse.Query(Parse.User).equalTo('username', username).first({ useMasterKey: true })
		.then(function(user) {
			if (user === undefined) {
				return Parse.Promise.error(404);
			}
			console.log("User id " + user.get('guid'));
			result.user = user;

			return user.save({password: "asdfasdfasdf"}, {useMasterKey: true});
		}).then(function(user){
			return Parse.User.logIn(username, "asdfasdfasdf");
		}).then(function(user){
			token = user.getSessionToken();
			console.log("Token " + user.getSessionToken());

			return Parse.Promise.when(
				new Parse.Query('Profile').equalTo("userId", result.user.get('guid')).find({ sessionToken: token }),
				new Parse.Query('Lesson').equalTo("creatorId", result.user.get('guid')).find({ sessionToken: token })
			);
		}).then(function(profiles, lessons) {
			result.profiles = profiles;
			result.lessons = lessons;

			var profileIds = [];
			var lessonIds = [];
			var i;
			for (i = 0; i < profiles.length; i++){
				profileIds.push(profiles[i].get('guid'));
			}
			for (i = 0; i < lessons.length; i++){
				lessonIds.push(lessons[i].get('guid'));
			}
			return Parse.Promise.when(
				new Parse.Query('ExtendedProfile').containedIn("associatedProfileId", profileIds).find({ sessionToken: token }),
				new Parse.Query('Item').containedIn("profileId", profileIds).find({ sessionToken: token }),
				new Parse.Query('Category').containedIn("profileId", profileIds).find({ sessionToken: token }),
				new Parse.Query('Resource').containedIn("profileId", profileIds).find({ sessionToken: token }),
				new Parse.Query('Settings').containedIn("profileId", profileIds).find({ sessionToken: token }),
				new Parse.Query('LessonStats').containedIn("profileId", profileIds).find({ sessionToken: token }),
				new Parse.Query('LessonTask').containedIn("lessonId", lessonIds).find({ sessionToken: token })
				);
		}).then(function(extendedProfiles, items, categories, resources, settings, lessonStats, lessonTasks){
			result.extendedProfiles = extendedProfiles;
			result.items = items;
			result.categories = categories;
			result.resources = resources;
			result.settings = settings;
			result.lessonStats = lessonStats;
			result.lessonTasks = lessonTasks;

			var lessonStatsIds = [];
			for (i = 0; i < lessonStats.length; i++){
				lessonStatsIds.push(lessonStats[i].get('guid'));
			}
			return Parse.Promise.when(
				new Parse.Query('LessonTaskStats').containedIn("lessonStatsId", lessonStatsIds).find({ sessionToken: token }));
		}).then(function(lessonTaskStats){
			result.lessonTaskStats = lessonTaskStats;

			console.log("Rendering the whole shebang");-
			console.log("User " + result.user.get('guid'));
			console.log("Profiles " + result.profiles.length);
			console.log("Extended profiles " + result.extendedProfiles.length);
			console.log("Settings " + result.settings.length);
			console.log("Categories " + result.categories.length);
			console.log("Items " + result.items.length);
			console.log("Resources " + result.resources.length);
			console.log("Lessons " + result.lessons.length);
			console.log("LessonTasks " + result.lessonTasks.length);
			console.log("LessonStats " + result.lessonStats.length);
			console.log("LessonTaskStats " + result.lessonTaskStats.length);
			if (!confirmed){
				res.render('deleteUser', { username: username, data: JSON.stringify(result) });
			}
			else{
				var i;
				var all = 
					result.lessonTaskStats.concat(
						result.lessonStats.concat(
							result.lessonTasks.concat(
								result.lessons.concat(
									result.resources.concat(
										result.items.concat(
											result.categories.concat(
												result.settings.concat(
													result.extendedProfiles.concat(result.profiles)
												)
											)
										)
									)
								)
							)
						)
					);
				console.log("Deleting " + all.length + " objects!")
				all.push(result.user);

				return Parse.Object.destroyAll(all, { sessionToken: token }).then(
					function(){
			            var params = 
			                {
			                    key: 'UJNOUhE5FDGYezERQyx3Ew',
			                    template_name: 'On Delete User',
			                    template_content: [{name:"test", content:"test"}],
			                    message: {
			                        to:[{email:username}]
			                    },
			                    async: true
			                };
			            Parse.Cloud.httpRequest({
			                method: "POST",
			                headers: {"Content-Type": "application/json"},
			                url: "https://mandrillapp.com/api/1.0/messages/send-template.json",
			                body: params,
			                success: function(r){
			                    console.log("Removal email sent");
								res.render(
									'deleteUser', 
									{ 
										username: username, 
										confirm: "User has been deleted", 
										data: JSON.stringify(result) 
									});
			                },
			                error: function(r){
			                    console.log("Removal email NOT sent");
								res.render(
									'deleteUser', 
									{ 
										username: username, 
										confirm: "User has been deleted", 
										data: JSON.stringify(result) 
									});
			                }
			            });
					});
			}
		},
		function(error) {
			if(error=404)
				res.render('deleteUser', { error: "The user " + username + " does not exist", username: username });
			else
				res.render('deleteUser', { error: "Can't get or parse data from Parse server"+(typeof error === 'number' ? ". Error code: "+error : ""),username: "" });
		});
};
