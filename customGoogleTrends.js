'use strict';

const googleTrendsAPI = require('google-trends-api');

exports.execute = function(request, response) {
  console.log("Got POST Request");
  //Read JSON
  var jsonString = '';
  var postData = '';
  request.on('data', function (data) {
    jsonString += data;
  });
  //Many methods are in here for asynch reasons
  request.on('end', function () {
    postData = JSON.parse(jsonString);

    //Shows data that was sent
    console.log(`Secret Value: ${postData.secret_val}`);
    for (var i = 0; i<postData.values.length; i++) {
      console.log(`Query ${i+1}: ${postData.values[i]}`);
    }

    //Get Trends results
    if (postData.secret_val.toString() === "potato") {
      var dates = new Map();
      dates.set("today", new Date());
      dates.set("priorDate2", new Date(new Date().setDate(dates.get("today").getDate()-2)));
      dates.set("priorDate10", new Date(new Date().setDate(dates.get("today").getDate()-10)));
      dates.set("priorDate32", new Date(new Date().setDate(dates.get("today").getDate()-32)));

      console.log(`Today's Date: ${dates.get("today")}`)
      console.log(`Date 2 days ago: ${dates.get("priorDate2")}`);
      console.log(`Date 10 days ago: ${dates.get("priorDate10")}`);
      console.log(`Date 32 days ago: ${dates.get("priorDate32")}`);

      var terms = [];
      for (var i = 0; i<postData.values.length; i++) {
        terms.push(postData.values[i]);
      }

      //Get cpu's term using related queries
      if (postData.mode.toString() === "CPU Mode") {
        console.log("Getting Related Queries:");
        /*
        For some reason postData.query.toString() caused the server to crash on herokuapp only.
        Removing .toString() fixed the bug.
        The crash location was found by entering heroku logs in the terminal.
        */
        googleTrendsAPI.relatedQueries({keyword: postData.query, geo: 'US', startTime: dates.get("priorDate32"), endTime: dates.get("priorDate2")})
        .then((results) => {
          var relatedQueries = JSON.parse(results);
          //Top Queries
          console.log(relatedQueries.default.rankedList[0]);
          //Rising Queries
          console.log(relatedQueries.default.rankedList[1]);
          var relatedQuery = cpuAnswer(relatedQueries);
          //.toLowerCase because terms are capitalised in dart app, but lowercase in googleTrendsAPI
          if (!relatedQuery.includes(postData.query.toLowerCase())) {
            console.log("Didn't Contain Word");
            relatedQuery += " " + postData.query;
          }
          terms.push(relatedQuery);
          console.log("Related Query: " + relatedQuery);
          interestOverTime();
        })
        .catch((error) => {
          console.log("There was a RelatedQueries error", error);
        })
      } else {
        interestOverTime();
      }

      function relatedQueries() {

      }

      function cpuAnswer(relatedQueries) {
        if (relatedQueries.default.rankedList[0].rankedKeyword.length == 0) {
          console.log("No RelatedQueries exist, word too obscure");
          return "Error";
        } else {
          switch (postData.difficulty.toString()) {
            case "Impossible":
              //Get first value from related
              return relatedQueries.default.rankedList[0].rankedKeyword[0].query;
              break;
            case "Hard":
              //Can only return the item, therefore .query required at end
              var possibleVal = relatedQueries.default.rankedList[0].rankedKeyword.find(function (item) {
                return item.value<20;
              });
              if (possibleVal !== undefined) {
                return possibleVal.query
              } else {
                return relatedQueries.default.rankedList[0].rankedKeyword.slice(-1)[0].query;
              }
              break;
            case "Normal":
              //Normal and Val need this if-else statement because without it we get an error when the
              //lowest value in the list is greater than 5 (or 20)
              var possibleVal = relatedQueries.default.rankedList[0].rankedKeyword.find(function (item) {
                return item.value<5;
              });
              if (possibleVal !== undefined) {
                //Calling .query on undefined causes error
                return possibleVal.query
              } else {
                return relatedQueries.default.rankedList[0].rankedKeyword.slice(-1)[0].query;
              }
              break;
            default:
              return relatedQueries.default.rankedList[0].rankedKeyword.slice(-1)[0].query;
          }
        }
      }

      function interestOverTime() {
        googleTrendsAPI.interestOverTime({
          keyword: terms,
          startTime: dates.get("priorDate32"),
          endTime: dates.get("priorDate2")
        })
        .then(function(results){
          //If console.log showing empty lists then no data available
          //This then causes a Type Error to display and 10 days ago data
          console.log(results);
          var trendsData = JSON.parse(results);
          var returnedVals = trendsData.default.averages;
          //If no results return 0s else return results
          if (returnedVals.length == 0) {
            console.log("No Results")
            for (var i=0; i<postData.values.length; i++) {
              returnedVals.push(0);
            }
          } else {
            console.log("Got Results:");
            for (var i=0; i<returnedVals.length; i++) {
              console.log(`Answer ${i+1}: ${returnedVals[i]}`);
            }
          }
          response.send(JSON.stringify({
              "values": returnedVals,
              //Ternary operator.
              //A property whose value is undefined isn't written when you stringify the object to JSON.
              "cpuAnswer": (postData.mode.toString() === "CPU Mode" ? terms.slice(-1)[0] : undefined)
            }));
        })
        .catch(function(err){
          console.log('Oh no there was a interestOverTime error', err);
          console.log('No Data Available for Query. Returning 0.')
          var returnedVals = [];
          for (var i=0; i<postData.values.length; i++) {
            returnedVals.push(0);
          }
          response.send(JSON.stringify({
              "values": returnedVals,
              "cpuAnswer": (postData.mode.toString() === "CPU Mode" ? terms.slice(-1)[0] : undefined)
            }));
        })
      }

    } else {
      return "Invalid POST request.";
    }
  });
}
