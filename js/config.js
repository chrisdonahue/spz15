window.spz = window.spz || {};

(function (spz) {
	// namespaces
	spz.defines = {};
	spz.client = {};
	spz.client.options = {};
	spz.client.options.control = {};
	spz.client.options.ui = {};
	spz.client.resources = {};
	spz.server = {};
	spz.server.options = {};

	// defines
	spz.defines.touch_id_mouse = 'mouse';
	spz.defines.orientation = {
		portrait: 'portrait',
		landscape: 'landscape'
	};
	spz.defines.midi_note_number_range = {
		lower: 9,
		upper: 100
	};
	var views_available = spz.defines.views_available = {
		keyboard: 'keyboard',
		envelope: 'envelope',
		patch: 'patch',
		sounds: 'sounds',
		output: 'output'
	};

	// client control options
	spz.client.options.control[views_available.keyboard] = {
		midi_note_velocity: 127
	};

	// client ui options
	spz.client.options.ui.views_enabled = [views_available.keyboard, views_available.envelope, views_available.patch, views_available.sounds, views_available.output];
	spz.client.options.ui.view_current = views_available.keyboard;
	spz.client.options.ui[views_available.keyboard] = {};
	spz.client.options.ui[views_available.keyboard].midi_octave = 5;
	spz.client.options.ui[views_available.keyboard].midi_octaves_displayed = 1;

	// resources
	spz.client.resources.view_icons = {};
	for (var i = 0; i < spz.client.options.ui.views_enabled.length; i++) {
		var view_id = spz.client.options.ui.views_enabled[i];
		spz.client.resources.view_icons[view_id] = {};
		//spz.client.resources.view_icons[view_id].url = 'http://upload.wikimedia.org/wikipedia/en/8/80/Wikipedia-logo-v2.svg';
		spz.client.resources.view_icons[view_id].url = 'img/view_icons/' + view_id + '.svg';
		spz.client.resources.view_icons[view_id].data = null;
		spz.client.resources.view_icons[view_id].image = null;
	}

	// server options
	spz.server.options.ip = 'cdonahue.me';
	spz.server.options.port = 1234;
})(window.spz);
