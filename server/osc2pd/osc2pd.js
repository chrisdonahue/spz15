(function (argc, argv, osc, WebSocket, dgram) {
	// default arguments
	var args = {
		udp: {
			port: 1235,
			ip: 'localhost'
		},
		debug: false
	}

	// parse arguments
	for (var i = 2; i < argc; i++) {
		var arg = argv[i];
		switch (arg) {
			case '--debug':
				args.debug = true;
				break;
			case '--noudp':
				delete args.udp;
				break;
			default:
				throw 'unexpected command line argument: ' + arg;
		}
	}

	// create web socket server
	var web_socket_port = 1234;
	var web_socket_server = new WebSocket.Server({ port: web_socket_port });

	// udp settings
	if ('udp' in args) {
		var udp_client = dgram.createSocket('udp4');
	}
	 
	// listen for web socket connections
	web_socket_server.on('connection', function (socket) {
		if (args.debug) {
			console.log('new connection');
		}

		// listen for messages on this socket, funnel to PD
		socket.on('message', function (message) {
			if (args.debug) {
				console.log(message);
			}
			if ('udp' in args) {
				udp_client.send(message, 0, message.length, args.udp.port, args.udp.ip, function(err, bytes) {});
			}
		});
	});
})(process.argv.length, process.argv, require('osc'), require('ws'), require('dgram'));
