//This server receives POST REQUESTS
var http = require('http');
const googleTrends = require('google-trends-api');

var server = http.createServer ( function(request,response){

  //Create Head for JSON response
  response.writeHead(200,{"Content-Type":"application/json"});

  if(request.method == "POST")
  {
    //console.log("Got POST Request");
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
      //console.log(`Secret Value: ${postData.secret_val}`);
      for (var i = 0; i<postData.values.length; i++) {
        //console.log(`Query ${i+1}: ${postData.values[i]}`);
      }

      //Get Trends results
      if (postData.secret_val.toString() === "potato") {
        var dates = new Map();
        dates.set("today", new Date());
        dates.set("priorDate2", new Date(new Date().setDate(dates.get("today").getDate()-2)));
        dates.set("priorDate10", new Date(new Date().setDate(dates.get("today").getDate()-10)));
        dates.set("priorDate32", new Date(new Date().setDate(dates.get("today").getDate()-32)));

        //console.log(`Today's Date: ${dates.get("today")}`)
        //console.log(`Date 2 days ago: ${dates.get("priorDate2")}`);
        //console.log(`Date 10 days ago: ${dates.get("priorDate10")}`);
        //console.log(`Date 32 days ago: ${dates.get("priorDate32")}`);

        var terms = [];
        for (var i = 0; i<postData.values.length; i++) {
          terms.push(postData.values[i]);
        }

        //Get cpu's term using related queries
        if (postData.mode.toString() === "CPU Mode") {
          //console.log("Getting Related Queries:");
          googleTrends.relatedQueries({keyword: postData.query.toString(), geo: 'US', startTime: dates.get("priorDate32"), endTime: dates.get("priorDate2")})
          .then((results) => {
            var relatedQueries = JSON.parse(results);
            //Top Queries
            //console.log(relatedQueries.default.rankedList[0]);
            //Rising Queries
            //console.log(relatedQueries.default.rankedList[1]);
            var relatedQuery = cpuAnswer(relatedQueries);
            if (!relatedQuery.includes(postData.query.toString())) {
              //console.log("Didn't Contain Word");
              relatedQuery += " " + postData.query.toString();
            }
            terms.push(relatedQuery);
            //console.log("Related Query: " + relatedQuery);
            interestOverTime();
          })
          .catch((error) => {
            //console.log("There was a RelatedQueries error", error);
          })
        } else {
          interestOverTime();
        }

        function relatedQueries() {

        }

        function cpuAnswer(relatedQueries) {
          if (relatedQueries.default.rankedList[0].rankedKeyword.length == 0) {
            //console.log("No RelatedQueries exist, word too obscure");
            return "Error";
          } else {
            switch (postData.difficulty.toString()) {
              case "impossible":
                //Get first value from related
                return relatedQueries.default.rankedList[0].rankedKeyword[0].query;
                break;
              case "hard":
                //Can only return the item, therefore .query required at end
                return relatedQueries.default.rankedList[0].rankedKeyword.find(function (item) {
                  return item.value<20;
                }).query;
                break;
              case "normal":
                return relatedQueries.default.rankedList[0].rankedKeyword.find(function (item) {
                  return item.value<5;
                }).query;
                break;
              default:
                return relatedQueries.default.rankedList[0].rankedKeyword.slice(-1)[0].query;
            }
          }
        }

        function interestOverTime() {
          googleTrends.interestOverTime({
            keyword: terms,
            startTime: dates.get("priorDate32"),
            endTime: dates.get("priorDate2")
          })
          .then(function(results){
            //If console.log showing empty lists then no data available
            //This then causes a Type Error to display and 10 days ago data
            //console.log(results);
            var trendsData = JSON.parse(results);
            var returnedVals = trendsData.default.averages;
            //If no results return 0s else return results
            if (returnedVals.length == 0) {
              //console.log("No Results")
              for (var i=0; i<postData.values.length; i++) {
                returnedVals.push(0);
              }
            } else {
              //console.log("Got Results:");
              for (var i=0; i<returnedVals.length; i++) {
                //console.log(`Answer ${i+1}: ${returnedVals[i]}`);
              }
            }
            response.end(
              JSON.stringify({
                "values": [returnedVals],
                //Ternary operator.
                //A property whose value is undefined isn't written when you stringify the object to JSON.
                "cpuAnswer": (postData.mode.toString() === "CPU Mode" ? terms.slice(-1)[0] : undefined)
              })
            );
          })
          .catch(function(err){
            //console.log('Oh no there was a interestOverTime error', err);
            //console.log('No Data Available for Query. Returning 0.')
            var returnedVals = [];
            for (var i=0; i<postData.values.length; i++) {
              returnedVals.push(0);
            }
            response.end(
              JSON.stringify({
                "values": [returnedVals],
                "cpuAnswer": (postData.mode.toString() === "CPU Mode" ? terms.slice(-1)[0] : undefined)
              })
            );
          })
        }

      } else {
        response.end("Invalid POST request.");
      }
    });
  }
});

server.listen(process.env.PORT || 3000);
console.log("Server running on port 3000");
