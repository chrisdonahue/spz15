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

	spz.server.osc = {};

	spz.server.osc.send = function (message_address, parameters) {
		spz.server.socket_osc.send({
			address: message_address,
			args: [spz.client.fingerprint].concat(parameters)
		});
	};

	var views_available = spz.defines.views_available;
	spz.server.osc[views_available.keyboard] = {};
	spz.server.osc[views_available.envelope] = {};

	spz.server.osc[views_available.keyboard].midi_note_number_on = function (midi_note_number) {
		spz.server.osc.send('/on', [midi_note_number]);
	};

	spz.server.osc[views_available.keyboard].midi_note_number_off = function (midi_note_number) {
		spz.server.osc.send('/off', [midi_note_number]);
	};

	spz.server.osc[views_available.envelope].change_attack = function (value_new) {
		spz.server.osc.send('/env/attack', [value_new]);
	};

	spz.server.osc[views_available.envelope].change_decay = function (value_new) {
		spz.server.osc.send('/env/decay', [value_new]);
	};

	spz.server.osc[views_available.envelope].change_sustain = function (value_new) {
		spz.server.osc.send('/env/sustain', [value_new]);
	};

	spz.server.osc[views_available.envelope].change_release = function (value_new) {
		spz.server.osc.send('/env/release', [value_new]);
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
