//This server receives POST REQUESTS
var http = require('http');
const googleTrends = require('./customGoogleTrends');
const multiplayer = require('./multiplayer');

var server = http.createServer ( function(request,response){

  //Create Head for JSON response
  response.writeHead(200,{"Content-Type":"application/json"});

  //Add /multiplayer at end of url to make true
  if (request.url === '/multiplayer') {
    multiplayer.execute();
  }

  //Reply to post request with my custom execute method
  if(request.method == "POST")
  {
    googleTrends.execute(request, response);
  }
});

server.listen(process.env.PORT || 3000);
console.log("Server running on port 3000");
