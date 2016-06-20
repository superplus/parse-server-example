MailChimpIntegration = require("cloud/functions/mailChimpIntegration.js");

var exec = function(code){
    console.log("Trying to use promoCode " + code);

    var result = new Parse.Promise();
    new Parse.Query("PromoCodes").equalTo("promoCode", code).first({
        useMasterKey: true,
        success: function(promoCode) {
            if (promoCode !== undefined){
                var today = new Date();
                var endsAt = new Date();
                endsAt.setTime(Date.parse(promoCode.get("endsAt")));
                
                if (endsAt < today){
                    return result.resolve({success:false, errorCode:302})
                }
                else if (parseInt(promoCode.get("used")) >= parseInt(promoCode.get("count"))){
                    return result.resolve({success:false, errorCode:303});
                }
                else{
                    promoCode.increment("used", 1);
                    promoCode.save();
                    
                    var subscription = null;
                    var trialdays = 0;
                    
                    var handout = promoCode.get("handout");
                    if (handout.indexOf("trial") == -1){
                        subscription = {
                            date: new Date().toISOString(),
                            receipt: "manual_receipt",
                            sku: handout,
                            trialDaysIncluded: 0
                        };
                    }
                    else{
                        trialdays = parseInt(handout.replace(/trialdays_/i, ''));
                    }

                    return result.resolve(
                        {
                            success:true, 
                            subscription: subscription,
                            trialdays: trialdays
                        });
                }
            }
            else{
                return result.resolve({success:false, errorCode:301});
            }
        },
        error: function(error) {
            return result.reject(error);
        }
    });

    return result;
}

exports.main = function(request, response) {
    exec(request.params.promoCode).then(
        function(result){
            if (result.success){
                if (result.subscription != null){
                    request.user.set('trialPeriodLength', 0);
                    request.user.add('subscriptions', result.subscription);
                }
                else{
                    request.user.set('trialPeriodLength', result.trialdays);
                }
                request.user.set('promoCode', request.params.promoCode);
                request.user.save(null, { 
                    useMasterKey: true, 
                    success: function(res){MailChimpIntegration.removeFromTrialList({object: request.user}, {success: function(){response.success(result);}});},
                    error: function(error){response.success(result);} 
                });
            }
            else{
                response.success(result);
            }
        },
        function(error){
            response.error(error);
        });
}


exports.usePromoCode = exec;