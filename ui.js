(function (spz, ctor) {
	spz.client.objects = spz.client.objects || {};
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
			_(this).bb = spz.client.objects.bb_abs(x, y, width, height);
		};

		prototype.intersects = function () {
			var bounding_box = _(this).bounding_box;
			return (bounding_box.x <= x && x < bounding_box.x + bounding_box.width) && (bounding_box.y <= y && y < bounding_box.y + bounding_box.height);
		};

		prototype.bounding_box_set = function (x, y, width, height) {
			_(this).bounding_box.x = x;
			_(this).bounding_box.y = y;
			_(this).bounding_box.width = width;
			_(this).bounding_box.height = height;
		};

		prototype.bounding_box_get = function () {
			return _(this).bounding_box;
		};
	});

	spz.client.views.base = rectangle.subclass(function(prototype, _, _protected, __, __private) {
		// public
		prototype.init = function (x, y, width, height) {
			prototype.super.init.apply(this, arguments);
			_(this).subviews = {};
		};

		prototype.redraw = function (canvas_ctx) {
			// redraw subviews
			for (var view in _(this).subviews) {
				view.redraw(canvas_ctx);
			}
		};
	});

	spz.client.views.root = spz.client.views.base.subclass(function(prototype, _, _protected, __, __private) {
		__private.settings = {};
		__private.settings[spz.defines.orientation.landscape] = {
			nav: {
				x: 0.0,
				y: 0.0,
				width: 0.2,
				height: 1.0
			}
		};
		__private.settings[spz.defines.orientation.portrait] = {
			nav: {
				x: 0.0,
				y: 0.0,
				width: 1.0,
				height: 0.2
			}
		};

		prototype.init = function (x, y, width, height) {
			prototype.super.init.apply(this, arguments);
		};

		prototype.redraw = function (canvas_ctx) {
			prototype.super.redraw.call(this, canvas_ctx);

			var bb = _(this).bounding_box;
			var nav_bb = spz.helpers.ui.bb_relative_to_absolute(__(this).settings[spz.client.ui.orientation].nav, bb, true);

			canvas_ctx.fillStyle = 'rgb(255, 0, 0)';
			canvas_ctx.fillRect(nav_bb.x, nav_bb.y, nav_bb.width, nav_bb.height);
			canvas_ctx.fillStyle = 'rgb(0, 0, 255)';
			if (spz.client.ui.orientation == spz.defines.orientation.landscape) {
				canvas_ctx.fillRect(nav_bb.width, 0, bb.width - nav_bb.width, bb.height);
			}
			else {
				canvas_ctx.fillRect(0, nav_bb.height, bb.width, bb.height - nav_bb.height);
			}

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

		prototype.redraw = function (canvas_ctx) {
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

				__(this).midi_note_number_to_bounding_box[midi_note_number] = bounding_box;
			}
		};
	});
})(window.spz, window.mozart);
