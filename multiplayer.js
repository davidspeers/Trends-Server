exports.execute = function() {
  'use strict';

  const express = require('express');
  const SocketServer = require('ws').Server;
  const path = require('path');

  const PORT = process.env.PORT || 3000;
  const INDEX = path.join(__dirname, 'index.html');

  const server = express()
    .use((req, res) => res.sendFile(INDEX) )
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));

  const wss = new SocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected');
    //Inside here messages can be received (check https://www.npmjs.com/package/ws#sending-and-receiving-text-data for more)
    ws.on('message', function incoming(message) {
      console.log('received: %s', message);
      //Works but gets taken over by the counter which runs every second
      ws.send(message);
    });
    ws.on('close', () => console.log('Client disconnected'));
  });
}


/*Every second send the time
setInterval(() => {
  wss.clients.forEach((client) => {
    client.send(new Date().toTimeString());
  });
}, 1000);*/
