const osc = require('osc');
const WebSocket = require('ws');

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8081 });
console.log('WebSocket server is listening on port 8081');

// Function to broadcast messages to all connected clients
function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Create an OSC UDP Port listening on port 57121
const udpPort = new osc.UDPPort({
  localAddress: '0.0.0.0',
  localPort: 57121,
});

udpPort.on('ready', () => {
  console.log('OSC Server is listening on port 57121');
});

// On receiving an OSC message, broadcast it to WebSocket clients
udpPort.on('message', function (oscMsg) {
  console.log('An OSC message just arrived!', oscMsg);
  broadcast(oscMsg);
});

udpPort.on('error', function (err) {
  console.log('An error occurred:', err.message);
});

// Open the UDP port
udpPort.open();
