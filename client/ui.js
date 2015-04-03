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
		_protected.settings = {};
		_protected.settings[spz.defines.orientation.landscape] = {};
		_protected.settings[spz.defines.orientation.portrait] = {};

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
		_protected.settings[spz.defines.orientation.landscape].nav = new spz.client.objects.bb_rel(
			0.0,
			0.0,
			0.2,
			1.0
		);
		_protected.settings[spz.defines.orientation.landscape].section = new spz.client.objects.bb_rel(
			0.2,
			0.0,
			0.8,
			1.0
		);
		_protected.settings[spz.defines.orientation.landscape].section_border = 0.02;

		_protected.settings[spz.defines.orientation.portrait].nav = new spz.client.objects.bb_rel(
			0.0,
			0.0,
			1.0,
			0.2
		);
		_protected.settings[spz.defines.orientation.portrait].section = new spz.client.objects.bb_rel(
			0.0,
			0.2,
			1.0,
			0.8
		);
		_protected.settings[spz.defines.orientation.portrait].section_border = 0.02;

		prototype.init = function (bb) {
			prototype.super.init.call(this, bb);
			__(this).section_bb_recalculate();
			//_(this).subviews[spz.defines.views.keyboard] = new spz.client.views.keyboard(__(this).section_bb);
		};

		prototype.bb_set = function (bb) {
			prototype.super.bb_set.call(this, bb);
			__(this).section_bb_recalculate();
			//_(this).subviews[spz.defines.views.keyboard].bb_set(__(this).section_bb);
		};

		prototype.redraw = function (canvas_ctx) {
			var bb = _(this).bb;
			var nav_bb = _(this).settings[spz.client.ui.orientation].nav.to_abs(bb);

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
			var settings = _(this).settings[spz.client.ui.orientation];
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
			__(this).midi_note_number_to_bounding_box = {};
			//__(this).recalc_midi_note_number_to_bounding_box();
		};

		prototype.bb_set = function (bb) {
			prototype.super.bb_set.call(this, bb);
			//__(this).recalc_midi_note_number_to_bounding_box();
		};

		prototype.redraw = function (canvas_ctx) {
			var bb = _(this).bb;
			canvas_ctx.fillStyle = 'rgb(255, 255, 255)';
			canvas_ctx.fillRect(bb.x, bb.y, bb.width, bb.height);
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
