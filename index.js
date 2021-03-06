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
4. What's the chance of rain in the next x hours?
  "There's an average x% chance of rain in the next x hours, with a peak of x% at <time>."
5. Tomorrow morning?
6. Tomorrow night?
7. Tonight.
8. This afternoon.

*/

var Alexa = require('alexa-sdk');
var http = require('http');
var states = {
  RAINMODE: '_RAINMODE'
};
var alexa;

var welcomeMessage = "I'm your obsessive rain forecaster. You can ask me if it will rain today, if it will rain at a particular hour, or if it will rain between two times.";

var welcomeReprompt = "I must forecast! Existence is pain! Please ask me if it will rain today, or ask me if it will rain at a certain time.";

var helpMessage = "Here are some examples of what to say: Will it rain today? Will it rain at 2pm today? Will it rain between 3pm and 8pm today?";

var goodbyeMessage = "Stay dry. Or get wet! You get to choose.";

var meeseeksMessage = 'Hello <say-as interpret-as="cardinal">12345</say-as>'; 


var newSessionHandlers = {
    'LaunchRequest': function () {
        this.handler.state = states.RAINMODE;
        output = welcomeMessage;
        this.emit(':ask', output, welcomeReprompt);
    },
    'getPresentWeatherIntent': function () {
        this.handler.state = states.RAINMODE;
        this.emitWithState('getPresentWeatherIntent');
    },
    'getRangeWeatherIntent': function () {
        this.handler.state = states.RAINMODE;
        this.emitWithState('getRangeWeatherIntent');
    },
    'getTargetWeatherIntent': function () {
        this.handler.state = states.RAINMODE;
        this.emitWithState('getTargetWeatherIntent');
    },
    'getDayWeatherIntent': function () {
        this.handler.state = states.RAINMODE;
        this.emitWithState('getDayWeatherIntent');
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
        output = helpMessage;
        this.emit(':ask', output, welcomeReprompt);
    }
};

var startRainHandlers = Alexa.CreateStateHandler(states.RAINMODE, {
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.HelpIntent': function () {
        output = helpMessage;
        this.emit(':ask', output, helpMessage);
    },
    'getPresentWeatherIntent': function() {
      httpGet('hourly', function (response) {
        var obj = JSON.parse(response);
        var hour_pct = obj["hourly_forecast"][0]["FCTTIME"]["hour"];
        var output = "Chance of rain this hour is " + hour_pct + " percent.";
        alexa.emit(':tell', output);
        //alexa.emit(':tell', meeseeksMessage);
      });
    },
    'getTargetWeatherIntent': function() {
      var targetTime = this.event.request.intent.slots.time.value;
      var tt = parseTime(targetTime).getTime();
      httpGet('hourly', function (response) {
        var obj = JSON.parse(response);
        var pct_chance;
        for (var i=0; i<24;i++) {
          var ht = parseTime(obj["hourly_forecast"][i]["FCTTIME"]["hour"]).getTime();
          if (ht == tt) {
            pct_chance = parseInt(obj["hourly_forecast"][i]["pop"]);
          }
        }
        var output = "The chance of rain at " + targetTime + " is " + pct_chance + " percent.";
        alexa.emit(':tell', output);
      });
    },
    'getRangeWeatherIntent': function() {
      var startTime = this.event.request.intent.slots.start_time.value;
      var endTime = this.event.request.intent.slots.end_time.value;
      httpGet('hourly', function (response) {
        var obj = JSON.parse(response);
        var pct_chance;
        var peak_chance = 0;
        var sum=0;
        var peak_time=0;
        for (var i=startTime; i<=endTime;i++) {
          pct_chance = parseInt(obj["hourly_forecast"][i]["pop"]);
          sum += pct_chance;
          if (pct_chance > peak_chance) {
            peak_chance = pct_chance;
            peak_time = i;
          }
        }
        var avg = Math.round((sum/8));
        //do something with range
        //var output = "You said between " + startTime + " and " + endTime;
        var output = "Average chance of rain between " + startTime + " and " + endTime + " is " + avg + " percent, with a peak of " + peak_chance + " at " + peak_time;
        alexa.emit(':tell', output);
      });
    },
    'getDayWeatherIntent': function() {
      httpGet('hourly', function (response) {
        var obj = JSON.parse(response);
        var sum=0;
        for (var i=0; i<8;i++) {
          sum += parseInt(obj["hourly_forecast"][i]["pop"]);
        }
        var avg = Math.round((sum/8));
        var output = "Average chance of rain in the next 8 hours is " + avg + " percent.";
        alexa.emit(':tell', output);
      });
    }
});

exports.handler = function(event, context, callback) {
  alexa = Alexa.handler(event, context);
  alexa.registerHandlers(newSessionHandlers, startRainHandlers);
  alexa.execute();
};

function httpGet(query, callback) {

  var options = {
    host: 'api.wunderground.com',
    path: '/api/158842b0cdbea83d/hourly/q/WA/Seattle.json',
    json: true
  };

  var req = http.request(options, (res) => {

    var body = '';
    var obj;

    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', function() {
      callback(body);
    });
  });
  req.end();

  req.on('error', (e) => {
    console.error(e);
  });
}

function parseTime(timeString) { 

    if (timeString == '') return null;

    var time = timeString.match(/(\d+)(:(\d\d))?\s*(p?)/i);
    if (time == null) return null;
  
    var hours = parseInt(time[1],10);    
    if (hours == 12 && !time[4]) {
          hours = 0;
    }
    else {
        hours += (hours < 12 && time[4])? 12 : 0;
    }
    var d = new Date();             
    d.setHours(hours);
    d.setMinutes(parseInt(time[3],10) || 0);
    d.setSeconds(0, 0);
    return d;

}
