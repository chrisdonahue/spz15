window.spz = window.spz || {};

(function (spz, capp) {
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
	};
	spz.client.options.control[views_available.envelope] = {
		attack: 0.00333333,
		decay: 0.00333333,
		sustain: 0.75,
		release: 0.0333333
	};
	spz.client.options.control[views_available.patch] = {
		lfo: {
			frequency: 0,
			amount: 0
		},
		reverb: {
			roomsize: 0.01,
			damping: 0.1,
			width: 0.5,
			wetdry: 0.01,
			freeze: 0.0
		}
	};
	spz.client.options.control[views_available.output] = {
		volume: 0.85,
		pan: 0.5
	};

	// client ui options
	if (capp.browser_type === capp.browser_types.ios) {
		spz.client.options.ui.view_icons_use = false;
	}
	else {
		spz.client.options.ui.view_icons_use = true;
	}
	spz.client.options.ui.views_enabled = [views_available.keyboard, views_available.envelope, views_available.patch, views_available.sounds, views_available.output];
	spz.client.options.ui.view_current = views_available.keyboard;
	spz.client.options.ui[views_available.keyboard] = {};
	spz.client.options.ui[views_available.keyboard].midi_octave = 5;
	spz.client.options.ui[views_available.keyboard].midi_octaves_displayed = 1;

	// resources
	if (spz.client.options.ui.view_icons_use) {
		spz.client.resources.view_icons = {};
		for (var i = 0; i < spz.client.options.ui.views_enabled.length; i++) {
			var view_id = spz.client.options.ui.views_enabled[i];
			var file_name = view_id;
			if (view_id === views_available.sounds) {
				file_name = 'pig';
			}
			spz.client.resources.view_icons[view_id] = {};
			spz.client.resources.view_icons[view_id].url = 'img/view_icons/' + file_name + '.svg';
			spz.client.resources.view_icons[view_id].data = null;
			spz.client.resources.view_icons[view_id].image = null;
		}
	}

	// server options
    spz.server.options.ip = 'cdonahue.me';
	spz.server.options.port = 1234;
})(window.spz, window.capp);
