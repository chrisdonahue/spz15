var osc = require("osc"),
    http = require("http"),
    WebSocket = require("ws"),
    dgram = require('dgram');
  
// Listen for Web Socket requests. 
var wss = new WebSocket.Server({ port: 1234 });

// goddamnit
var PORT = 1235;
var HOST = 'localhost';
var client = dgram.createSocket('udp4');

 
// Listen for Web Socket connections. 
wss.on("connection", function (socket) {
	console.log('wat');

	socket.on('message', function (message) {
		client.send(message, 0, message.length, PORT, HOST, function(err, bytes) {});
		console.log(message);
	});
/*
    var socketPort = new osc.WebSocketPort({
        socket: socket
    });
 
    socketPort.on("message", function (oscMsg) {
	var message = oscMsg;
        console.log("An OSC Message was received!", oscMsg);
    });
*/
});


