/* Rainhour
Author: Chris Caruso
Feb 2017

Skill that provides a more specific forecast for the day's precipitation
*/
var alexa = require('alexa-sdk')
var http = require('http')

var options = {
  host: 'api.wunderground.com',
  path: '/api/158842b0cdbea83d/hourly/q/WA/Seattle.json',
  json: true
};


function httpGet(query, callback) {

  var req = http.request(options, (res) => {

    var body = '';
    var obj;

    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', function() {
      //obj = JSON.parse(str)
      //for (var i=0; i<obj["hourly_forecast"].length; i++) {
      //  console.log(obj["hourly_forecast"][i]["FCTTIME"]["hour"]+": "+obj["hourly_forecast"][i]["pop"]);
      //}
      callback(body);
    });
  });
  req.end();

  req.on('error', (e) => {
    console.error(e)
  });
}
httpGet('zug', function (response) {

  var obj = JSON.parse(response);
  for (var i=0; i<obj["hourly_forecast"].length; i++) {
    console.log(obj["hourly_forecast"][i]["FCTTIME"]["hour"]+": "+obj["hourly_forecast"][i]["pop"]);
  }
});
