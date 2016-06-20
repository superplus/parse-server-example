var Buffer = require('buffer').Buffer
var Crypto = require('crypto')
exports.main = function (request, status) {
  Parse.Cloud.useMasterKey()
  console.log('This is a job!')
  var query = new Parse.Query ("Resource")
  query.doesNotExist('externalURL')
  query.count({
    success:function(count){
      console.log('There are ' + count + ' resources left to be moved')
      var copied = 0
      /*if (request.params.startWith != null) {
        copied = request.params.startWith
      }*/
      var promisesl1 = []
      var promisesl2 = []
      var promisesl3 = []
      if (copied < count) {
        //console.log('Moving 5 files, starting with: ' + copied)
        moveFiles(copied, count, status, promisesl1, promisesl2, promisesl3)
      }
    }
  })
}
function sign (datestring, dataToSign) {
  var DateKey = Crypto.createHmac('sha256', 'AWS42OYVavODcf2Sk83iSijPdhuH+KcZ4XQF4IbDyTP4').update(datestring).digest()
  var DateRegionKey = Crypto.createHmac('sha256', DateKey).update('us-east-1').digest()
  var DateRegionServiceKey = Crypto.createHmac('sha256', DateRegionKey).update('s3').digest()
  var SigningKey = Crypto.createHmac('sha256', DateRegionServiceKey).update('aws4_request').digest()
  return Crypto.createHmac('sha256', SigningKey).update(dataToSign).digest('hex')
}
function moveFiles(startPos,count,status,promisesl1,promisesl2,promisesl3){
  Parse.Cloud.useMasterKey()
  var query = new Parse.Query ("Resource")
  query.limit(5)
  //query.skip(startPos)
  query.doesNotExist('externalURL')
  promisesl1.push(query.find({
    success: function (resources) {
      resources.forEach(function(resource){
        if(resource.get('file') !== undefined && resource.get('guid')!==undefined){
          ////console.log(resource.get('file')._url)
          var url = resource.get('file')._url
          if(resource.get('externalURL')==undefined){
            ////console.log('File on old server, should be moved to new server')
            promisesl2.push(Parse.Cloud.httpRequest({
              url: url
            }).then(function (thefile) {
              if(thefile.buffer.length!=0){
                ////console.log(resource.get('guid'))
                var d1 = new Date()
                var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                var datestring = '' + d1.getFullYear() + (d1.getMonth() < 9 ? '0' : '') + (d1.getMonth() + 1) + (d1.getDate() < 10 ? '0' : '') + d1.getDate()
                var datetimestring = datestring + 'T' + (d1.getHours() < 10 ? '0' : '') + d1.getHours() + (d1.getMinutes() < 10 ? '0' : '') + d1.getMinutes() + (d1.getSeconds() < 10 ? '0' : '') + d1.getSeconds() + 'Z'
                ////console.log('AKIAI4NBLQHJEUKOGV4Q/' + datestring + '/us-east-1/s3/aws4_request')
                ////console.log('host;date;authorization;content-type;content-length')
                var canonicalString = 'PUT\n/' + resource.get('guid') + '.' + resource.get('extension') + '\n\ndate:' + days[d1.getDay() - 1] + ', ' + d1.getDate() + ' ' + months[d1.getMonth()] + ' ' + d1.getFullYear() + ' ' + (d1.getHours() < 10 ? '0' : '') + d1.getHours() + ':' + (d1.getMinutes() < 10 ? '0' : '') + d1.getMinutes() + ':' + (d1.getSeconds() < 10 ? '0' : '') + d1.getSeconds() + ' GMT\nhost:superplus.filestorage.s3.amazonaws.com\nx-amz-acl:public-read\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:' + datetimestring + '\n\ndate;host;x-amz-acl;x-amz-content-sha256;x-amz-date\nUNSIGNED-PAYLOAD'
                ////console.log(canonicalString)
                var stringToSign = 'AWS4-HMAC-SHA256\n' + datetimestring + '\n' + datestring + '/us-east-1/s3/aws4_request\n' + Crypto.createHash('sha256').update(canonicalString).digest('hex')
                ////console.log(stringToSign)
                var authKey = sign(datestring, stringToSign)
                ////console.log(authKey)
                promisesl3.push(Parse.Cloud.httpRequest({
                  method: 'PUT',
                  url: 'http://superplus.filestorage.s3.amazonaws.com/' + resource.get('guid') + '.' + resource.get('extension'),
                  headers: {
                    'Host': 'superplus.filestorage.s3.amazonaws.com',
                    'Date': days[d1.getDay() - 1] + ', ' + d1.getDate() + ' ' + months[d1.getMonth()] + ' ' + d1.getFullYear() + ' ' + (d1.getHours() < 10 ? '0' : '') + d1.getHours() + ':' + (d1.getMinutes() < 10 ? '0' : '') + d1.getMinutes() + ':' + (d1.getSeconds() < 10 ? '0' : '') + d1.getSeconds() + ' GMT',
                    'Authorization': 'AWS4-HMAC-SHA256 Credential=AKIAI4NBLQHJEUKOGV4Q/' + datestring + '/us-east-1/s3/aws4_request,SignedHeaders=date;host;x-amz-acl;x-amz-content-sha256;x-amz-date,Signature=' + authKey,
                    'X-Amz-Acl': 'public-read',
                    'X-Amz-Date': datetimestring,
                    'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD'
                  },
                  body: thefile.buffer,
                  success: function (httpResponse) {
                    ////console.log(
                    resource.set('externalURL', 'http://superplus.filestorage.s3.amazonaws.com/' + resource.get('guid') + '.' + resource.get('extension'))
                    resource.save()
                    //console.log('File copied successfully!')
                    //status.success()
                  },
                  error: function (httpResponse) {
                    console.log('Save request ' + resource.get('guid') + ' failed with response code ' + httpResponse.status)
                    console.log(httpResponse.text)
                    if(httpResponse.status!=500){
                      resource.set('externalURL', '')
                      resource.save()
                    }
                    //status.error('Request failed with response code ' + httpResponse.status)
                  }
                }))
              }else{
                resource.set('externalURL', '')
                resource.save()
              }
            }, function (httpResponse) {
              // error
              //console.error('Request ' + resource.get('guid') + ' failed with response code ' + httpResponse.status)
              resource.set('externalURL', '')
              resource.save()
            }))
          } else {
            //console.log('File already moved!')
            //status.success()
          }
        }else{
          //console.error('File ' + resource.get('guid') + ' does not exist')
          resource.set('externalURL', '')
          resource.save()
        }
      })
    },
    error: function (error) {
      //console.log('Could not find user. ' + error)
      //status.error('Could not find user. ' + error)
    }
  }))
  Parse.Promise.when(promisesl1).then(function(){
    //console.log('Done waiting for level 1 promises, starting wait for ' + promisesl2.length + ' level 2 promises')
  Parse.Promise.when(promisesl2).then(function(){
    //console.log('Done waiting for level 2 promises, starting wait for ' + promisesl3.length + ' level 3 promises')
  Parse.Promise.when(promisesl3).then(function(){
    //console.log('Done waiting for level 3 promises')
    startPos += 5
    if(startPos < count) {
      promisesl1 = []
      promisesl2 = []
      promisesl3 = []
      //console.log('Moving 5 files, starting with: ' + startPos)
      moveFiles(startPos,count, status, promisesl1,promisesl2,promisesl3)
    }else{
      status.success()
    }
  },
  function(errors){
    //console.log('Waiting promise for level 3 failed ' + errors)
  })},
  function(errors){
    //console.log('Waiting promise for level 2 failed ' + errors)
    startPos += 5
    if(startPos < count) {
      promisesl1 = []
      promisesl2 = []
      promisesl3 = []
      //console.log('Moving 5 files, starting with: ' + startPos)
      moveFiles(startPos,count, status, promisesl1,promisesl2,promisesl3)
    }else{
      status.success()
    }
  })},
  function(errors){
    //console.log('Waiting promise for level 1 failed ' + errors)
  })
}
