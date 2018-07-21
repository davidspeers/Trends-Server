'use strict';

//use heroku logs in terminal for debugging
//if the app return !DOCTYPE this means it is a server error

var express = require('express');
const googleTrends = require('./customGoogleTrends');
const SocketServer = require('ws').Server;
var WebSocket = require('ws');


const PORT = process.env.PORT || 3000;
var app             = express();
var server          = app.listen(PORT);

const wss = new SocketServer({ server });

app.use(function (request, response) {

  //Create Head for JSON response
  //response.writeHead(200,{"Content-Type":"application/json"});

  //Reply to post request with my custom execute method
  if(request.method == "POST")
  {
    googleTrends.execute(request, response);
  }
});

wss.on('connection', (ws, request) => {
  //The request parameter and below line are used as a ws room, alternatively use socket.io
  ws.upgradeReq = request;

  console.log('Client connected');
  //Inside here messages can be received (check https://www.npmjs.com/package/ws#sending-and-receiving-text-data for more)
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    //Works but gets taken over by the counter which runs every second
    var postData = JSON.parse(message);
    //ws.send(message);
    ws.send(postData.Query)
  });

  wss.clients.forEach(function (client) {
      console.log("Got milk");
      console.log(client.toString());
			if (client.upgradeReq.url === ws.upgradeReq.url){//} && client.id !== ws.id) {
        console.log("Got bread")
				//if (client && client.readyState === WebSocket.OPEN) {
					//count++;
					client.send("hello");
				//}
			}
  });

  ws.on('close', () => console.log('Client disconnected'));
});
