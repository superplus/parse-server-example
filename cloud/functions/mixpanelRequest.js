exports.mixpanelRequest = function(url,args,expiration, aac_stats){
	if(!args.hasOwnProperty("expire")){
		var date = new Date();
		//args["expire"]=String(Math.round(date.getTime()/1000)+(typeof expiration === "undefined" ? 60 : expiration));
		args["expire"]=String(Math.round(date.getTime()/1000)+ 60);
	}
	if(!args.hasOwnProperty("api_key")){
		if (!aac_stats){
			args["api_key"]="a0e9a52ce60af86598d765d5d2b81e59"; // Main key
			//args["api_key"]="a826a12b841cbd47126a42b3abf68c92"; // Dev key
		}
		else{
			args["api_key"]="ac8d61dff98ff634391b3c38998c4cde"; // AAC key
		}
	}
	var api_secret;
	if (!aac_stats){
		api_secret = "14f5f039668984fcbe59701e326e721b"; // Main secret
		//api_secret = "edf9e2ad07dcd10179231fc6081b9cad"; // Dev secret
	}
	else{
		api_secret = "2bcf09285a94260575f7fcadc2878789"; // AAC secret
	}
	var httpArguments=[]
	for(var key in args){
		if (args.hasOwnProperty(key)) {
			httpArguments[httpArguments.length]=(key+"="+args[key]);
		}
	}
	httpArguments.sort();
	var md5er = require("cloud/functions/md5.js");
	var signature = httpArguments.join("");
	var md5signature = md5er.md5(signature+api_secret);

	var urlEnd = url.substring(url.length-2);
	if(urlEnd.indexOf("/")==-1 || urlEnd.indexOf("?")==-1){
		if(url.substring(url.length-1)!="/"){
			url+="/?";
		}else{
			url+="?";
		}
	}
	return (url+"sig="+md5signature+"&"+httpArguments.join("&").replace(/ /g,"%20"));
}

exports.main = function(request, response) {

	var url = request.params.url;
	var args = request.params.args;
	var aac_stats = request.params.aac_stats;
	var expiration = request.params.expiration;

	response.success({ url: exports.mixpanelRequest(url, args, expiration, aac_stats)});
}