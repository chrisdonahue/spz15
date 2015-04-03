(function (spz, ctor) {
	spz.client.objects = spz.client.objects || {};
	spz.client.views = spz.client.views || {};

	var component = ctor(function(prototype, _, _protected, __, __private) {
		// public
		prototype.init = function () {
			throw "abstract method called";
		};

		prototype.contains = function (x, y) {
			throw "abstract method called";
		};
	});

	spz.client.views.base = component.subclass(function(prototype, _, _protected, __, __private) {
		// public
		prototype.init = function (bb) {
			_(this).bb = bb || new spz.client.objects.bb_abs();
			_(this).subviews = {};
		};

		prototype.bb_set = function (bb) {
			_(this).bb = bb;
		};
		
		prototype.bb_get = function (bb) {
			return _(this).bb;
		};
		
		prototype.contains = function (x, y) {
			return _(this).bb.contains(x, y);
		};

		prototype.redraw = function (canvas_ctx) {
			// redraw subviews
			for (subview_identifier in _(this).subviews) {
				_(this).subviews[subview_identifier].redraw(canvas_ctx);
			}
		};
	});

	spz.client.views.root = spz.client.views.base.subclass(function(prototype, _, _protected, __, __private) {
		__private.settings = {};
		__private.settings[spz.defines.orientation.landscape] = {};
		__private.settings[spz.defines.orientation.portrait] = {};
		__private.settings[spz.defines.orientation.landscape].nav = new spz.client.objects.bb_rel(
			0.0,
			0.0,
			0.2,
			1.0
		);
		__private.settings[spz.defines.orientation.landscape].section = new spz.client.objects.bb_rel(
			0.2,
			0.0,
			0.8,
			1.0
		);
		__private.settings[spz.defines.orientation.landscape].section_border = 0.02;

		__private.settings[spz.defines.orientation.portrait].nav = new spz.client.objects.bb_rel(
			0.0,
			0.0,
			1.0,
			0.2
		);
		__private.settings[spz.defines.orientation.portrait].section = new spz.client.objects.bb_rel(
			0.0,
			0.2,
			1.0,
			0.8
		);
		__private.settings[spz.defines.orientation.portrait].section_border = 0.02;

		prototype.init = function (bb) {
			prototype.super.init.call(this, bb);
			__(this).section_bb_recalculate.call(this);
			_(this).subviews[spz.defines.views.keyboard] = new spz.client.views.keyboard(__(this).section_bb);
		};

		prototype.bb_set = function (bb) {
			prototype.super.bb_set.call(this, bb);
			__(this).section_bb_recalculate.call(this);
			_(this).subviews[spz.defines.views.keyboard].bb_set(__(this).section_bb);
		};

		prototype.redraw = function (canvas_ctx) {
			var bb = _(this).bb;
			var nav_bb = __(this).settings[spz.client.ui.orientation].nav.to_abs(bb);

			canvas_ctx.fillStyle = 'rgb(255, 0, 0)';
			canvas_ctx.fillRect(nav_bb.x, nav_bb.y, nav_bb.width, nav_bb.height);
			canvas_ctx.fillStyle = 'rgb(0, 0, 255)';
			if (spz.client.ui.orientation == spz.defines.orientation.landscape) {
				canvas_ctx.fillRect(nav_bb.width, 0, bb.width - nav_bb.width, bb.height);
			}
			else {
				canvas_ctx.fillRect(0, nav_bb.height, bb.width, bb.height - nav_bb.height);
			}

			prototype.super.redraw.call(this, canvas_ctx);
		};

		__private.section_bb_recalculate = function () {
			var settings = __(this).settings[spz.client.ui.orientation];
			__(this).section_bb = settings.section.to_abs(_(this).bb, false).with_border(settings.section_border);
		};
	});

	spz.client.views.keyboard = spz.client.views.base.subclass(function(prototype, _, _protected, __, __private) {
		__private.settings = {
			key_spacing: 0.02,
			key_white_color: 'rgb(255, 255, 255)',
			key_white_down_color: 'rgb(10, 46, 166)',
			key_white_outline: 'rgb(50, 50, 50)',
			key_black_color: 'rgb(0, 0, 0)',
			key_black_down_color: 'rgb(245, 209, 89)',
			key_black_outline: 'rgb(50, 50, 50)'
		};

		// public methods
		prototype.init = function (bb) {
			prototype.super.init.call(this, bb);
			__(this).midi_note_number_to_bb = {};
			__(this).buffer_dirty = false;
			__(this).recalc_midi_note_number_to_bb.call(this);
			__(this).buffer = document.createElement('canvas');
			__(this).buffer.width = _(this).bb.width;
			__(this).buffer.height = _(this).bb.height;
			__(this).buffer_ctx = __(this).buffer.getContext('2d');
		};

		prototype.bb_set = function (bb) {
			prototype.super.bb_set.call(this, bb);
			__(this).buffer.width = _(this).bb.width;
			__(this).buffer.height = _(this).bb.height;
			__(this).recalc_midi_note_number_to_bb.call(this);
		};

		prototype.redraw = function (canvas_ctx) {
			var bb = _(this).bb;
			var settings = __(this).settings;

			// get canvas dimensions
			var canvas_width = bb.width;
			var canvas_height = bb.height;
			var canvas_buffer = __(this).buffer;

			var midi_note_number_lower = spz.client.ui.keyboard.midi_note_number_lower;
			var midi_note_number_upper = spz.client.ui.keyboard.midi_note_number_upper;

			var midi_note_number_to_bb = __(this).midi_note_number_to_bb;

			// redraw buffer if we need to
			if (__(this).buffer_dirty) {
				// resize buffer
				canvas_buffer.width = canvas_width;
				canvas_buffer.height = canvas_height;
				var canvas_buffer_ctx = canvas_buffer.getContext('2d');

				// draw debug square to show when we're not filling the canvas
				canvas_buffer_ctx.fillStyle = 'rgb(255, 0, 255)';
				canvas_buffer_ctx.fillRect(0, 0, canvas_width, canvas_height);

				// draw white keys
				for (var midi_note_number = midi_note_number_lower; midi_note_number <= midi_note_number_upper; midi_note_number++) {
					if (!spz.helpers.midi.note_number_key_white_is(midi_note_number)) {
						continue;
					}
					var bb_key = midi_note_number_to_bb[midi_note_number];
					canvas_buffer_ctx.fillStyle = settings.key_white_outline;
					canvas_buffer_ctx.fillRect(bb_key.x, bb_key.y, bb_key.width, bb_key.height);
					canvas_buffer_ctx.fillStyle = settings.key_white_color;
					var key_outline = Math.max(1, Math.floor(settings.key_spacing * bb_key.width));
					canvas_buffer_ctx.fillRect(bb_key.x + key_outline, bb_key.y + key_outline, bb_key.width - (key_outline * 2), bb_key.height - (key_outline * 2));
				}

				// draw black keys
				for (var midi_note_number = midi_note_number_lower; midi_note_number <= midi_note_number_upper; midi_note_number++) {
					if (spz.helpers.midi.note_number_key_white_is(midi_note_number)) {
						continue;
					}
					var bb_key = midi_note_number_to_bb[midi_note_number];
					canvas_buffer_ctx.fillStyle = settings.key_black_outline;
					canvas_buffer_ctx.fillRect(bb_key.x, bb_key.y, bb_key.width, bb_key.height);
					canvas_buffer_ctx.fillStyle = settings.key_black_color;
					var key_outline = Math.max(1, Math.floor(settings.key_spacing * bb_key.width));
					canvas_buffer_ctx.fillRect(bb_key.x + key_outline, bb_key.y + key_outline, bb_key.width - (key_outline * 2), bb_key.height - (key_outline * 2));
				}

				// mark canvas buffer as clean
				__(this).buffer_dirty = false;
			}

			// fill in canvas from buffer
			canvas_ctx.drawImage(canvas_buffer, bb.x, bb.y);

			// highlight selected note
			for (var midi_note_number_string in spz.client.control.midi_note_number_to_touch_id) {
				var midi_note_number = Number(midi_note_number_string);
				var key_white_is = helpers.midi.note_number_key_white_is(midi_note_number);

				// set fill color
				if (key_white_is) {
					canvas_ctx.fillStyle = settings.key_white_down_color;
				}
				else {
					canvas_ctx.fillStyle = settings.key_black_down_color;
				}

				// fill
				var bb_key = midi_note_number_to_bb[midi_note_number];
				var key_outline = Math.max(1, Math.floor(settings.key_spacing * bb_key.width));
				canvas_ctx.fillRect(bb_key.x + key_outline, bb_key.y + key_outline, bb_key.width - (key_outline * 2), bb_key.height - (key_outline * 2));

				// redraw surrounding black keys
				if (key_white_is) {
					var midi_note_number_adjacents = [midi_note_number - 1, midi_note_number + 1];
					canvas_ctx.fillStyle = settings.key_black_color;
					for (var i = 0; i < 2; i++) {
						var midi_note_number_adjacent = midi_note_number_adjacents[i];
						if (helpers.midi.note_number_key_white_is(midi_note_number_adjacent)) {
							continue;
						}
						var bb_key = midi_note_number_to_bb(midi_note_number_adjacent);
						if (bb_key !== null) {
							canvas_ctx.fillStyle = settings.key_black_outline;
							canvas_ctx.fillRect(bb_key.x, bb_key.y, bb_key.width, bb_key.height);
							canvas_ctx.fillStyle = settings.key_black_color;
							var key_outline = Math.max(1, Math.floor(settings.key_spacing * bb_key.width));
							canvas_ctx.fillRect(bb_key.x + key_outline, bb_key.y + key_outline, bb_key.width - (key_outline * 2), bb_key.height - (key_outline * 2));
						}
					}
				}
			}
		};

		// private methods
		__private.recalc_midi_note_number_to_bb = function () {
			var midi_note_number_lower = spz.client.ui.keyboard.midi_note_number_lower;
			var midi_note_number_upper = spz.client.ui.keyboard.midi_note_number_upper;
			var bb = _(this).bb;

			__(this).midi_note_number_to_bb = {};

			// count white keys
			var keys_white_total = 0;
			for (var midi_note_number = midi_note_number_lower; midi_note_number <= midi_note_number_upper; midi_note_number++) {
				if (spz.helpers.midi.note_number_key_white_is(midi_note_number)) {
					keys_white_total++;
				}
			}

			// create bounding boxes
			var key_white_width = Math.floor(bb.width / keys_white_total);
			var canvas_width_remainder = Math.floor(bb.width % keys_white_total);
			var key_white_width_extra_every = Math.floor(keys_white_total / canvas_width_remainder);
			var key_white_height = bb.height;
			var key_black_width = key_white_width * 0.7;
			var key_black_height = key_white_height * 0.6;
			var key_black_offset = key_white_width * 0.35;
			var keys_white_calculated = 0;
			var keys_black_calculated = 0;
			var canvas_width_covered = 0;
			for (midi_note_number = midi_note_number_lower; midi_note_number <= midi_note_number_upper; midi_note_number++) {
				var bb_key = new spz.client.objects.bb_abs();

				// white key bounding box
				if (spz.helpers.midi.note_number_key_white_is(midi_note_number)) {
					bb_key.x = canvas_width_covered;
					bb_key.y = 0;
					bb_key.width = key_white_width;
					bb_key.height = key_white_height;
					// add extra space every few notes to fill in remainder
					if (keys_white_calculated === keys_white_total - 1) {
						bb_key.width += canvas_width_remainder;
						canvas_width_remainder = 0;
					}
					else if (keys_white_calculated % key_white_width_extra_every === 0 && canvas_width_remainder > 0) {
						bb_key.width += 1;
						canvas_width_remainder--;
					}
					keys_white_calculated++;
					canvas_width_covered += bb_key.width;
				}
				// black key bounding box
				else {
					bb_key.x = canvas_width_covered - key_black_offset;
					bb_key.y = 0;
					bb_key.width = key_black_width;
					bb_key.height = key_black_height;
					keys_black_calculated++;
				}

				__(this).midi_note_number_to_bb[midi_note_number] = bb_key;
			}

			__(this).buffer_dirty = true;
		};
	});
})(window.spz, window.mozart);
