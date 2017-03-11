/* Rainhour
Author: Chris Caruso
Feb 2017

Skill that provides a more specific forecast for the day's precipitation.

Desired functionality is to be able to ask three different questions:

1. Will it rain today?
  Expected answer should be something like, "It might rain today. There's a 20% chance overall chance of rain, peaking at 35% between 6 and 8 pm."
2. Will it rain at 2pm today?
  Expected answer should be: "There's a x% chance of rain at 2pm."
3. Will it rain between 3 and 8 today?
  Expected answer should report something like an average of percent chance over that period, or peak chance.
*/
var Alexa = require('alexa-sdk')
var http = require('http')
var alexa;

var welcome_message = "I'm your autistic rain forecaster. You can ask me if it will rain today, if it will rain at a particular hour, or if it will rain between two times."

var welcome_reprompt = "I must forecast! Existence is pain! Please ask me if it will rain today, or ask me if it will rain at a certain time."

var help_message = "Here are some examples of what to say: Will it rain today? Will it rain at 2pm today? Will it rain between 3pm and 8pm today?"

var goodbye_message = "Stay dry. Or get wet! You get to choose."

var options = {
  host: 'api.wunderground.com',
  path: '/api/158842b0cdbea83d/hourly/q/WA/Seattle.json',
  json: true
};

var newSessionHandlers = {
    'LaunchRequest': function () {
        output = welcomeMessage;
        this.emit(':ask', output, welcomeRepromt);
    },
    'day_weather': function () {
        this.emitWithState('getAttractionIntent');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        // Use this function to clear up and save any data needed between sessions
        this.emit(":tell", goodbyeMessage);
    },
    'SessionEndedRequest': function () {
        // Use this function to clear up and save any data needed between sessions
        this.emit('AMAZON.StopIntent');
    },
    'Unhandled': function () {
        output = HelpMessage;
        this.emit(':ask', output, welcomeRepromt);
    },
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
httpGet('hourly', function (response) {

  var obj = JSON.parse(response);
  for (var i=0; i<obj["hourly_forecast"].length; i++) {
    console.log(obj["hourly_forecast"][i]["FCTTIME"]["hour"]+": "+obj["hourly_forecast"][i]["pop"]);
  }
});
