(function (spz, osc, fingerprint) {
	spz.server = spz.server || {};
	
	spz.server.callbacks = spz.server.callbacks || {};
	
	/*
		server callbacks
	*/
	
	spz.server.callbacks.open = function (event) {
		console.log('socket open');
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
	
	spz.server.osc_send = function (message_type, parameters) {
		spz.server.socket_osc.send({
			address: '/' + message_type,
			args: [spz.client.fingerprint].concat(parameters)
		});
	};

	spz.server.midi_note_number_on = function (midi_note_number) {
		spz.server.osc_send('on', [midi_note_number, 127]);
	};

	spz.server.midi_note_number_off = function (midi_note_number) {
		spz.server.osc_send('off', [midi_note_number]);
	};

	/*
		init server
	*/

	// init client fingerprint
	spz.client.fingerprint = ((new Date()).getTime()) % (new fingerprint().get());
	
	try {
		var server_uri = 'ws://' + String(spz.server.options.ip) + ':' + String(spz.server.options.port);
		spz.server.socket_osc = new osc.WebSocketPort({
			url: server_uri
		});
	}
	catch (e) {
		alert('Could not connect to server. Try refreshing.');
		throw 'Could not connect to server';
	}
	
	// register socket callbacks
	spz.server.socket_osc.on('open', spz.server.callbacks.open);
	spz.server.socket_osc.on('close', spz.server.callbacks.close);
	spz.server.socket_osc.on('message', spz.server.callbacks.message);
	spz.server.socket_osc.on('error', spz.server.callbacks.error);

	// open port
	spz.server.socket_osc.open();

})(window.spz, window.osc, window.Fingerprint);