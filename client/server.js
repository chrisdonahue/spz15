(function (spz, fingerprint) {
	spz.server = spz.server || {};
	
	spz.server.callbacks = spz.server.callbacks || {};
	
	/*
		server callbacks
	*/
	
	spz.server.callbacks.open = function (event) {
		console.log('socket open');
		
		// send device fingerprint
		spz.server.send(spz.client.fingerprint);
	};
	
	spz.server.callbacks.close = function (event) {
		console.log('socket close');
	};
	
	spz.server.callbacks.message = function (event) {
		console.log('socket message: ' + event.data);
	};
	
	spz.server.callbacks.error = function (event) {
		console.log('socket error: ' + event.data);
	};
	
	spz.server.send = function (message_type, parameters) {
		var message_serialized = message_type.toString();
		for (parameter in parameters) {
			message_serialized += ' ' + parameter.toString();
		}
		spz.server.socket.send(message_serialized);
	};

	/*
		init server
	*/

	// init client fingerprint
	spz.client.fingerprint = new fingerprint().get();
	
	try {
		var server_uri = 'ws://' + String(spz.server.options.ip) + ':' + String(spz.server.options.port);
		spz.server.socket = new WebSocket(server_uri);
	}
	catch (e) {
		alert('Could not connect to server. Try refreshing.');
		throw 'Could not connect to server';
	}
	
	// register socket callbacks
	spz.server.socket.onopen = spz.server.callbacks.open;
	spz.server.socket.onclose = spz.server.callbacks.close;
	spz.server.socket.onmessage = spz.server.callbacks.message;
	spz.server.socket.onerror = spz.server.callbacks.error;
})(window.spz, window.Fingerprint);
