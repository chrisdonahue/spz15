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
			_(this).dirty = true;
			__(this).subviews = {};
			__(this).subviews_count = 0;
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

		prototype.touch_start = function (event) {
			for (subview_id in _(this).subviews) {
				if (_(this).subviews[subview_id].contains(event.x
			}
		};

		prototype.touch_move = function (event) {
		};

		prototype.touch_end = function (event) {
		};

		prototype.touch_cancel = function (event) {
		};

		prototype.touch_leave = function (event) {
		};

		prototype.redraw_necessary = function () {
			if (_(this).dirty) {
				return true;
			}
			for (subview_id in _(this).subviews) {
				if (_(this).subviews[subview_id].redraw_necessary()) {
					return true;
				}
			}
			return false;
		};

		prototype.redraw = function (canvas_ctx) {
			// redraw subviews
			for (subview_id in _(this).subviews) {
				var subview = _(this).subviews[subview_id];
				if (subview.redraw_necessary()) {
					subview.redraw(canvas_ctx);
				}
			}

			// mark as clean
			_(this).dirty = false;
		};

		_protected.subview_add = function (subview_id, subview) {
			__(this).subviews[subview_id] = subview;
			__(this).subviews_count++;
		};

		_protected.subview_remove = function (subview_id) {
			delete __(this).subviews[subview_id];
			__(this).subviews_count--;
		};

		_protected.subviews_count = function () {
			return __(this).subviews_count;
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
			for (var subview_id in spz.defines.views_enabled) {
				var subview_name = spz.defines.views_enabled[subview_id];
				_(this).subviews[subview_name] = new spz.client.views[subview_name](__(this).section_bb);
			}
		};

		prototype.bb_set = function (bb) {
			prototype.super.bb_set.call(this, bb);
			__(this).section_bb_recalculate.call(this);
			for (var subview_id in spz.defines.views_enabled) {
				var subview_name = spz.defines.views_enabled[subview_id];
				_(this).subviews[subview_name].bb_set(__(this).section_bb);
			}
		};

		prototype.touch_start = function (event) {
			var view_current = _(this).subviews[spz.client.ui.view_current];
			var touch_event = event.changedTouches[0];
			if (view_current.contains(touch_event.clientX, touch_event.clientY)) {
				view_current.touch_start(event);
			}
		};

		prototype.touch_move = function (event) {
			var view_current = _(this).subviews[spz.client.ui.view_current];
			var touch_event = event.changedTouches[0];
			if (view_current.contains(touch_event.clientX, touch_event.clientY)) {
				view_current.touch_move(event);
			}
		};

		prototype.touch_end = function (event) {
			var view_current = _(this).subviews[spz.client.ui.view_current];
			var touch_event = event.changedTouches[0];
			if (view_current.contains(touch_event.clientX, touch_event.clientY)) {
				view_current.touch_end(event);
			}
			else {
				// change view
			}
		};

		prototype.touch_cancel = function (event) {
			var view_current = _(this).subviews[spz.client.ui.view_current];
			var touch_event = event.changedTouches[0];
			if (view_current.contains(touch_event.clientX, touch_event.clientY)) {
				view_current.touch_cancel(event);
			}
		};

		prototype.touch_leave = function (event) {
			var view_current = _(this).subviews[spz.client.ui.view_current];
			var touch_event = event.changedTouches[0];
			if (view_current.contains(touch_event.clientX, touch_event.clientY)) {
				view_current.touch_leave(event);
			}
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

			/*
			if (spz.client.resources.view_icons[spz.defines.views_enabled.keyboard].data !== null) {
				canvas_ctx.drawSvg(spz.client.resources.view_icons[spz.defines.views_enabled.keyboard].data, 0, 0, 100, 100);
			}
			*/

			prototype.super.redraw.call(this, canvas_ctx);
		};

		__private.section_bb_recalculate = function () {
			var settings = __(this).settings[spz.client.ui.orientation];
			__(this).section_bb = settings.section.to_abs(_(this).bb, false).with_border(settings.section_border);
		};
	});

	spz.client.views[spz.defines.views_available.envelope] = spz.client.views.base.subclass(function(prototype, _, _protected, __, __private) {
		__private.settings = {
		};

		prototype.init = function (bb) {
			prototype.super.init.call(this, bb);
		};

		prototype.bb_set = function (bb) {
			prototype.super.bb_set.call(this, bb);
		};

		prototype.touch_start = function (event) {
		};

		prototype.touch_move = function (event) {
		};

		prototype.touch_end = function (event) {
		};

		prototype.touch_cancel = function (event) {
		};

		prototype.touch_leave = function (event) {
		};

		prototype.redraw = function (canvas_ctx) {
			var bb = _(this).bb;

			canvas_ctx.fillStyle = 'rgb(255, 0, 0)';
			canvas_ctx.fillRect(bb.x, bb.y, bb.width, bb.height);
			prototype.super.redraw.call(this, canvas_ctx);
		};
	});

	spz.client.views[spz.defines.views_available.patch] = spz.client.views.base.subclass(function(prototype, _, _protected, __, __private) {
		__private.settings = {
		};

		prototype.init = function (bb) {
			prototype.super.init.call(this, bb);
		};

		prototype.bb_set = function (bb) {
			prototype.super.bb_set.call(this, bb);
		};

		prototype.touch_start = function (event) {
		};

		prototype.touch_move = function (event) {
		};

		prototype.touch_end = function (event) {
		};

		prototype.touch_cancel = function (event) {
		};

		prototype.touch_leave = function (event) {
		};

		prototype.redraw = function (canvas_ctx) {
			var bb = _(this).bb;

			canvas_ctx.fillStyle = 'rgb(0, 255, 0)';
			canvas_ctx.fillRect(bb.x, bb.y, bb.width, bb.height);
			prototype.super.redraw.call(this, canvas_ctx);
		};
	});

	spz.client.views[spz.defines.views_available.output] = spz.client.views.base.subclass(function(prototype, _, _protected, __, __private) {
		__private.settings = {
		};

		prototype.init = function (bb) {
			prototype.super.init.call(this, bb);
		};

		prototype.bb_set = function (bb) {
			prototype.super.bb_set.call(this, bb);
		};

		prototype.touch_start = function (event) {
		};

		prototype.touch_move = function (event) {
		};

		prototype.touch_end = function (event) {
		};

		prototype.touch_cancel = function (event) {
		};

		prototype.touch_leave = function (event) {
		};

		prototype.redraw = function (canvas_ctx) {
			var bb = _(this).bb;

			canvas_ctx.fillStyle = 'rgb(0, 0, 255)';
			canvas_ctx.fillRect(bb.x, bb.y, bb.width, bb.height);
			prototype.super.redraw.call(this, canvas_ctx);
		};
	});

	spz.client.views[spz.defines.views_available.keyboard] = spz.client.views.base.subclass(function(prototype, _, _protected, __, __private) {
		__private.settings = {
		};

		prototype.init = function (bb) {
			prototype.super.init.call(this, bb);
		};

		prototype.bb_set = function (bb) {
			prototype.super.bb_set.call(this, bb);
		};

		prototype.touch_start = function (event) {
		};

		prototype.touch_move = function (event) {
		};

		prototype.touch_end = function (event) {
		};

		prototype.touch_cancel = function (event) {
		};

		prototype.touch_leave = function (event) {
		};

		prototype.redraw = function (canvas_ctx) {
			var bb = _(this).bb;

			canvas_ctx.fillStyle = 'rgb(0, 255, 255)';
			canvas_ctx.fillRect(bb.x, bb.y, bb.width, bb.height);

			prototype.super.redraw.call(this, canvas_ctx);
		};
	});

	/*
	spz.client.views[spz.defines.views_available.keyboard] = spz.client.views.base.subclass(function(prototype, _, _protected, __, __private) {
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

		prototype.touch_start = function (event) {
			for (var i = 0; i < event.changedTouches.length; i++) {
				var touch = event.changedTouches[i];
				var touch_id = touch.identifier;
				var midi_note_number = __(this).touch_to_midi_note_number.call(this, touch);
				if (!(midi_note_number in spz.client.control.midi_note_number_to_touch_id)) {
					spz.server.midi_note_number_on(midi_note_number);
					spz.client.control.midi_note_number_to_touch_id[midi_note_number] = touch_id;
					spz.client.control.touch_id_to_midi_note_number[touch_id] = midi_note_number;
				}
			}
		};

		prototype.touch_move = function (event) {
			for (var i = 0; i < event.changedTouches.length; i++) {
				var touch = event.changedTouches[i];
				var touch_id = touch.identifier;
				var midi_note_number = __(this).touch_to_midi_note_number.call(this, touch);
				if (touch_id in spz.client.control.touch_id_to_midi_note_number) {
					var midi_note_number_old = spz.client.control.touch_id_to_midi_note_number[touch_id];
					if (midi_note_number_old !== midi_note_number) {
						spz.server.midi_note_number_off(midi_note_number_old);
						delete spz.client.control.midi_note_number_to_touch_id[midi_note_number_old];
						delete spz.client.control.touch_id_to_midi_note_number[touch_id];
						spz.server.midi_note_number_on(midi_note_number);
						spz.client.control.midi_note_number_to_touch_id[midi_note_number] = touch_id;
						spz.client.control.touch_id_to_midi_note_number[touch_id] = midi_note_number;
					}
				}
			}
		};

		prototype.touch_end = function (event) {
			for (var i = 0; i < event.changedTouches.length; i++) {
				var touch_id = event.changedTouches[i].identifier;
				if (touch_id in spz.client.control.touch_id_to_midi_note_number) {
					var midi_note_number = spz.client.control.touch_id_to_midi_note_number[touch_id];
					spz.server.midi_note_number_off(midi_note_number);
					delete spz.client.control.midi_note_number_to_touch_id[midi_note_number];
					delete spz.client.control.touch_id_to_midi_note_number[touch_id];
				}
			}
		};

		prototype.touch_cancel = function (event) {
			for (var i = 0; i < event.changedTouches.length; i++) {
				var touch_id = event.changedTouches[i].identifier;
				if (touch_id in spz.client.control.touch_id_to_midi_note_number) {
					var midi_note_number = spz.client.control.touch_id_to_midi_note_number[touch_id];
					spz.server.midi_note_number_off(midi_note_number);
					delete spz.client.control.midi_note_number_to_touch_id[midi_note_number];
					delete spz.client.control.touch_id_to_midi_note_number[touch_id];
				}
			}
		};

		prototype.touch_leave = function (event) {
			for (var i = 0; i < event.changedTouches.length; i++) {
				var touch_id = event.changedTouches[i].identifier;
				if (touch_id in spz.client.control.touch_id_to_midi_note_number) {
					var midi_note_number = spz.client.control.touch_id_to_midi_note_number[touch_id];
					spz.server.midi_note_number_off(midi_note_number);
					delete spz.client.control.midi_note_number_to_touch_id[midi_note_number];
					delete spz.client.control.touch_id_to_midi_note_number[touch_id];
				}
			}
		};

		__private.touch_to_midi_note_number = function (touch) {
			var bb = _(this).bb;
			var x = touch.clientX - bb.x;
			var y = touch.clientY - bb.y;

			var midi_note_number_lower = spz.client.ui.keyboard.midi_note_number_lower;
			var midi_note_number_upper = spz.client.ui.keyboard.midi_note_number_upper;

			var midi_note_number_to_bb = __(this).midi_note_number_to_bb;

			// try black keys
			for (var midi_note_number = midi_note_number_lower; midi_note_number <= midi_note_number_upper; midi_note_number++) {
				if (spz.helpers.midi.note_number_key_white_is(midi_note_number)) {
					continue;
				}

				var bb = midi_note_number_to_bb[midi_note_number];
				if (bb.contains(x, y)) {
					return midi_note_number;
				}
			}

			// try white keys
			for (var midi_note_number = midi_note_number_lower; midi_note_number <= midi_note_number_upper; midi_note_number++) {
				if (spz.helpers.midi.note_number_key_black_is(midi_note_number)) {
					continue;
				}

				var bb = midi_note_number_to_bb[midi_note_number];
				if (bb.contains(x, y)) {
					return midi_note_number;
				}
			}

			// no note pressed (this shouldn't happen)
			return null;
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
				var key_white_is = spz.helpers.midi.note_number_key_white_is(midi_note_number);

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
				canvas_ctx.fillRect(bb_key.x + key_outline + bb.x, bb_key.y + key_outline + bb.y, bb_key.width - (key_outline * 2), bb_key.height - (key_outline * 2));

				// redraw surrounding black keys
				if (key_white_is) {
					var midi_note_number_adjacents = [midi_note_number - 1, midi_note_number + 1];
					canvas_ctx.fillStyle = settings.key_black_color;
					for (var i = 0; i < 2; i++) {
						var midi_note_number_adjacent = midi_note_number_adjacents[i];
						if (spz.helpers.midi.note_number_key_white_is(midi_note_number_adjacent)) {
							continue;
						}
						var bb_key = midi_note_number_to_bb[midi_note_number_adjacent];
						if (bb_key !== null) {
							canvas_ctx.fillStyle = settings.key_black_outline;
							canvas_ctx.fillRect(bb_key.x + bb.x, bb_key.y + bb.y, bb_key.width, bb_key.height);
							canvas_ctx.fillStyle = settings.key_black_color;
							var key_outline = Math.max(1, Math.floor(settings.key_spacing * bb_key.width));
							canvas_ctx.fillRect(bb_key.x + key_outline + bb.x, bb_key.y + key_outline + bb.y, bb_key.width - (key_outline * 2), bb_key.height - (key_outline * 2));
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
			var key_black_width = Math.floor(key_white_width * 0.7);
			var key_black_height = Math.floor(key_white_height * 0.6);
			var key_black_offset = Math.floor(key_white_width * 0.35);
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
	*/
})(window.spz, window.mozart);
