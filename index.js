//This one receives POST REQUESTS!!!!
var http = require('http');
const googleTrends = require('google-trends-api');

var server = http.createServer ( function(request,response){

  response.writeHead(200,{"Content-Type":"application/json"});
  if(request.method == "POST")
  {
    console.log("Got POST");
    //Read JSON
    var jsonString = '';
    var postData = '';
    request.on('data', function (data) {
      jsonString += data;
    });
    //Many methods are in here for asynch reasons
    request.on('end', function () {
      postData = JSON.parse(jsonString);
      console.log(`Secret Value: ${postData.secret_val}`);
      console.log(`Query 1: ${postData.val1}`);
      console.log(`Query 2: ${postData.val2}`);
      //Get Trends results
      if (postData.secret_val.toString() === "potato") {
        var today = new Date();
        var priorDate2 = new Date().setDate(today.getDate()-2);
        var formattedDate2 = new Date(priorDate2);
        var priorDate10 = new Date().setDate(today.getDate()-10);
        var formattedDate10 = new Date(priorDate10);
        console.log(`Today's Date: ${today}`)
        console.log(`Date 2 days ago: ${formattedDate2}`)
        console.log(`Date 10 days ago: ${formattedDate10}`)
        googleTrends.interestOverTime({keyword: [postData.val1, postData.val2], startTime: formattedDate2, endTime: formattedDate2})
        .then(function(results){
          var trendsData = JSON.parse(results);
          console.log(trendsData)
          var returnedVals = trendsData.default.timelineData[0].formattedValue
          console.log(`Answer 1: ${returnedVals[0]}`);
          console.log(`Answer 2: ${returnedVals[1]}`);
          response.end(`{ "val1": ${returnedVals[0]}, "val2": ${returnedVals[1]} }`);
        })
        .catch(function(err){
          console.error('Oh no there was an error', err);
          googleTrends.interestOverTime({keyword: [postData.val1, postData.val2], startTime: formattedDate10, endTime: formattedDate10})
          .then(function(results){
            var trendsData = JSON.parse(results);
            var returnedVals = trendsData.default.timelineData[0].formattedValue
            console.log(`Answer 1: ${returnedVals[0]}`);
            console.log(`Answer 2: ${returnedVals[1]}`);
            response.end(`{ val1: ${returnedVals[0]}, val2: ${returnedVals[1]} }`);
          })
          .catch(function(err){
            console.log('Oh no there was another error', err);
            console.log('No Data Available for Query. Returning 0.')
            response.end("{ \"val1\": 0, \"val2\": 0 }")
          })
        });
      } else {
        response.end("Invalid POST request.");
      }
    });
  }
});

server.listen(process.env.PORT || 3000);
console.log("Server running on port 3000");
