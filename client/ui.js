(function (spz, ctor) {
	spz.client.views = spz.client.views || {};

	var bounded_object = ctor(function(prototype, _, _protected, __, __private) {
		// public
		prototype.init = function () {
			throw "abstract method called";
		};

		prototype.intersects = function (x, y) {
			throw "abstract method called";
		};
	});

	var rectangle = bounded_object.subclass(function(prototype, _, _protected, __, __private) {
		// public
		prototype.init = function (x, y, width, height) {
			__(this).bounding_box = {
				x: x,
				y: y,
				width: width,
				height: height
			};
		};

		prototype.intersects = function () {
			var bounding_box = __(this).bounding_box;
			return (bounding_box.x <= x && x < bounding_box.x + bounding_box.width) && (bounding_box.y <= y && y < bounding_box.y + bounding_box.height);
		};

		prototype.bounding_box_set = function (x, y, width, height) {
			__(this).bounding_box.x = x;
			__(this).bounding_box.y = y;
			__(this).bounding_box.width = width;
			__(this).bounding_box.height = height;
		};

		prototype.bounding_box_get = function () {
			return __(this).bounding_box;
		};
	});

	spz.client.views.base = rectangle.subclass(function(prototype, _, _protected, __, __private) {
		// public
		prototype.init = function (x, y, width, height) {
			prototype.super.init.call(this, arguments);
			__(this).buffer = document.createElement('canvas');
			__(this).buffer_ctx = __(this).buffer.getContext('2d');
		};

		prototype.buffer_get = function () {
			return __(this).buffer;
		};

		prototype.redraw = function () {
			throw "abstract method called";
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
		prototype.init = function (x, y, width, height) {
			prototype.super.init.call(this, arguments);
			__(this).midi_note_number_to_bounding_box = {};
			__(this).recalc_midi_note_number_to_bounding_box();
		};

		prototype.bounding_box_set = function (x, y, width, height) {
			prototype.super.bounding_box_set.call(this, arguments);
			__(this).recalc_midi_note_number_to_bounding_box();
		};

		prototype.redraw = function () {
		};

		// private methods
		__private.recalc_midi_note_number_to_bounding_box = function () {
			var midi_note_number_lower = spz.client.ui.keyboard.midi_note_number_lower;
			var midi_note_number_upper = spz.client.ui.keyboard.midi_note_number_upper;

			__(this).midi_note_number_to_bounding_box = {};

			// count white keys
			var keys_white_total = 0;
			for (var midi_note_number = spz.client.ui.keyboard.midi_note_number_display_lower; midi_note_number <= spz.client.ui.keyboard.midi_note_number_display_upper; midi_note_number++) {
				if (helpers.midi.note_number_key_white_is(midi_note_number)) {
					keys_white_total++;
				}
			}

			// create bounding boxes
			var key_white_width = Math.floor(_(this).bounding_box.width / keys_white_total);
			var canvas_width_remainder = Math.floor(_(this).bounding_box.width % keys_white_total);
			var key_white_width_extra_every = Math.floor(keys_white_total / canvas_width_remainder);
			var key_white_height = _(this).bounding_box.height;
			var key_black_width = key_white_width * 0.7;
			var key_black_height = key_white_height * 0.6;
			var key_black_offset = key_white_width * 0.35;
			var keys_white_calculated = 0;
			var keys_black_calculated = 0;
			var canvas_width_covered = 0;
			for (midi_note_number = spz.client.ui.keyboard.midi_note_number_display_lower; midi_note_number <= spz.client.ui.keyboard.midi_note_number_display_upper; midi_note_number++) {
				var bounding_box = {};

				// white key bounding box
				if (helpers.midi.note_number_key_white_is(midi_note_number)) {
					bounding_box.x = canvas_width_covered;
					bounding_box.y = 0;
					bounding_box.width = key_white_width;
					bounding_box.height = key_white_height;
					// add extra space every few notes to fill in remainder
					if (keys_white_calculated === keys_white_total - 1) {
						bounding_box.width += canvas_width_remainder;
						canvas_width_remainder = 0;
					}
					else if (keys_white_calculated % key_white_width_extra_every === 0 && canvas_width_remainder > 0) {
						bounding_box.width += 1;
						canvas_width_remainder--;
					}
					keys_white_calculated++;
					canvas_width_covered += bounding_box.width;
				}
				// black key bounding box
				else {
					bounding_box.x = canvas_width_covered - key_black_offset;
					bounding_box.y = 0;
					bounding_box.width = key_black_width;
					bounding_box.height = key_black_height;
					keys_black_calculated++;
				}

				_(this).midi_note_number_to_bounding_box[midi_note_number] = bounding_box;
			}
		};
	});
})(window.spz, window.mozart);
