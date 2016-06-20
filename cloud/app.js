
// These two lines are required to initialize Express.
var express = require('express');
var app = express();
 
// Global app configuration section
app.set('views', 'cloud/views');
app.set('view engine', 'ejs');
app.use(express.bodyParser());

var auth = express.basicAuth("Superplus", "Sup3rplus");

function hook(method, name, path) {
	if (path === undefined)
		path = "/" + name;
	
	switch (method.toLowerCase()) {
		case "get":	app.get(path, auth, function(req, res) { require("cloud/webhooks/" + name + ".js").get(req, res) }); break;
		case "post": app.post(path, auth, function(req, res) { require("cloud/webhooks/" + name + ".js").post(req, res) }); break;
		case "put": app.put(path, auth, function(req, res) { require("cloud/webhooks/" + name + ".js").put(req, res) }); break;
		case "delete": app.delete(path, auth, function(req, res) { require("cloud/webhooks/" + name + ".js").delete(req, res); }); break;
		case "view": app.get(path, auth, function(req, res) { res.render(name, req.params) }); break;
		default: throw "Invalid method " + JSON.stringify(method);
	}
}

function public(method, name, path) {
	if (path === undefined)
		path = "/" + name;

	switch (method.toLowerCase()) {
		case "get":	app.get(path, function(req, res) { require("cloud/webhooks/" + name + ".js").get(req, res) }); break;
		case "post": app.post(path, function(req, res) { require("cloud/webhooks/" + name + ".js").post(req, res) }); break;
		case "put": app.put(path, function(req, res) { require("cloud/webhooks/" + name + ".js").put(req, res) }); break;
		case "delete": app.delete(path, function(req, res) { require("cloud/webhooks/" + name + ".js").delete(req, res); }); break;
		case "view": app.get(path, function(req, res) { res.render(name, req.params); }); break;
		default: throw "Invalid method " + JSON.stringify(method);
	}
}


hook("VIEW", "index", "/");

hook("GET", "analyticsListeners");
hook("PUT", "analyticsListeners");

hook("GET", "cloneUser", "/cloneUser");
hook("GET", "cloneUser", "/cloneUser/:username");
hook("POST", "cloneUser", "/cloneUser/:username");

hook("GET", "editSubscription", "/editSubscription");
hook("GET", "editSubscription", "/editSubscription/:username");
hook("PUT", "editSubscription", "/editSubscription/:username");
hook("POST", "editSubscription", "/editSubscription/:username");

hook("GET", "extendTrialPeriod", "/extendTrialPeriod");	
hook("GET", "extendTrialPeriod", "/extendTrialPeriod/:username");
hook("PUT", "extendTrialPeriod", "/extendTrialPeriod/:username/:trialPeriodLength");

hook("GET", "queryUserData");
hook("GET", "queryUserData", "/queryUserData/:username");

hook("GET", "deleteUser");
hook("GET", "deleteUser", "/deleteUser/:username");
hook("GET", "deleteUser", "/deleteUser/:username/:confirmed");

hook("GET","listUsers","/listUsers")
hook("GET","listUsers","/listUsers/:page")
hook("GET","listUsers","/listUsers/search/:query")
hook("GET","listUsers","/listUsers/search/:query/:page")

hook("GET","promocodes","/promocodes")
hook("GET","promocodes","/promocodes/:page")
hook("GET","promocodes","/promocodes/search/:query")
hook("GET","promocodes","/promocodes/search/:query/:page")
hook("PUT","promocodes", "/promocodes/:name/:promoCode/:handout/:endsAt/:count");

hook("GET","testMixpanel","/testMixpanel")

hook("GET","tutorialFunnel","/tutorialFunnel")

public("POST", "notifyInactiveTrialUsers", "/notifyInactiveTrialUsers/:secret");

public("GET", "analyticsWeb", "/analyticsWeb");
public("GET", "analyticsWeb", "/analyticsWeb/:page");

public("POST", "mixpanelNotification", "/mixpanelNotification");

//app.post("/notifyInactiveTrialUsers", express.basicAuth("username", "password"), function(req, res) { require("cloud/webhooks/notifyInactiveTrialUsers.js").get(req, res); })
//public("GET", "echo", "/echo/:message", express.basicAuth());

app.listen();