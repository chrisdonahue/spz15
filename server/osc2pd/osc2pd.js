(function (argc, argv, osc, WebSocket) {
	// default arguments
	var args = {
		web_socket: {
			port: 1234
		},
		udp: {
			address: 'localhost',
			port: 1235
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
	var web_socket_server = new WebSocket.Server({port: args.web_socket.port});

	// udp settings
	if ('udp' in args) {
		// create udp client
		var udp_client = new osc.UDPPort({
			remoteAddress: args.udp.address,
			remotePort: args.udp.port
		});
		udp_client.on('message', function (message) {
			console.log('receieved message via UDP for some reason');
		});
		udp_client.open();
	}
	 
	// listen for web socket connections
	web_socket_server.on('connection', function (socket) {
		if (args.debug) {
			console.log('new connection');
		}

		// create osc parser
		var socket_osc = new osc.WebSocketPort({
			socket: socket
		});

		// listen for messages on this socket, funnel to PD
		socket_osc.on('message', function (message) {
			if (args.debug) {
				console.log(message);
			}
			if ('udp' in args) {
				udp_client.send(message);
			}
		});
	});

})(process.argv.length, process.argv, require('osc'), require('ws'));
