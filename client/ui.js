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

	spz.client.views.canvas_app = ctor(function(prototype, _, _protected, __, __private) {
		prototype.init = function (canvas_id, root_type) {
			// canvas
			var canvas = __(this).canvas = document.getElementById(canvas_id);
			__(this).canvas_ctx = canvas.getContext('2d');

			// root view
			var root = __(this).root = new root_type();
			__(this).root_bb = new spz.client.objects.bb_abs();

			// event handling
			if (window.supports_touch_events) {
				var that = this;
				var event_touch_shim = function (callback) {
					return function (event) {
						event.consumed = false;
						if (!('changedTouches' in event)) {
							event = event.originalEvent;
						}
						callback(event);
						that.redraw();
					}
				};

				canvas.ontouchstart = event_touch_shim(root.event_callback_get('touch_start'));
				canvas.ontouchmove = event_touch_shim(root.event_callback_get('touch_move'));
				canvas.ontouchend = event_touch_shim(root.event_callback_get('touch_end'));
				canvas.ontouchleave = event_touch_shim(root.event_callback_get('touch_leave'));
				canvas.ontouchcancel = event_touch_shim(root.event_callback_get('touch_cancel'));
			}
			else {
				var that = this;
				var event_mouse_to_touch_shim = function (callback) {
					return function(event) {
						event.consumed = false;
						event.changedTouches = [];
						event.changedTouches.push({
							clientX: event.clientX || -1,
							clientY: event.clientY || -1,
							identifier: spz.defines.touch_id_mouse
						});
						callback(event);
						that.redraw();
					};
				}

				canvas.onmousedown = event_mouse_to_touch_shim(root.event_callback_get('touch_start'));
				canvas.onmousemove = event_mouse_to_touch_shim(root.event_callback_get('touch_move'));
				canvas.onmouseup = event_mouse_to_touch_shim(root.event_callback_get('touch_end'));
				canvas.onmouseleave = event_mouse_to_touch_shim(root.event_callback_get('touch_leave'));
			}
		};

		prototype.resize = function (width, height) {
			// change canvas width
			var canvas = __(this).canvas;
			canvas.width = width;
			canvas.height = height;

			// change root nood width
			__(this).root_bb.width = width;
			__(this).root_bb.height = height;
			__(this).root.bb_set(__(this).root_bb);

			// redraw
			this.redraw.call(this);
		};

		prototype.canvas_context_2d_get = function () {
			return __(this).canvas_ctx;
		};

		prototype.redraw = function (force) {
			console.log('--------');
			force = force || false;
			__(this).root.redraw(__(this).canvas_ctx, force);
		};
	});

	spz.client.views.base = component.subclass(function(prototype, _, _protected, __, __private) {
		prototype.init = function () {
			_(this).bb = new spz.client.objects.bb_abs();
			_(this).dirty = false;
			__(this).subviews = {};
			__(this).subviews_count = 0;
			__(this).event_callbacks = __(this).event_callbacks || {};
		};

		prototype.bb_set = function (bb) {
			_(this).bb = bb || new spz.client.objects.bb_abs();
			_(this).dirty = true;
		};
		
		prototype.bb_get = function (bb) {
			return _(this).bb;
		};
		
		prototype.contains = function (x, y) {
			return _(this).bb.contains(x, y);
		};

		prototype.event_on = function (event_type, callback) {
			__(this).event_callbacks[event_type] = callback;
		};

		prototype.event_off = function (event_type) {
			delete __(this).event_callbacks[event_type];
		};

		prototype.event_callback_get = function (event_type) {
			var that = this;
			var subviews = __(this).subviews;
			var callbacks = __(this).event_callbacks;
			return function (event) {
				for (var subview_id in subviews) {
					var subview = subviews[subview_id];
					var touch_event = event.changedTouches[0];
					if (subview.contains(touch_event.clientX, touch_event.clientY)) {
						subview.event_callback_get(event_type)(event);
					}
				}
				if (!event.consumed && event_type in callbacks) {
					callbacks[event_type].call(that, event);
				}
			}
		};

		prototype.redraw = function (canvas_ctx, force) {
			force = force || false;

			if (force) {
				// redraw
				_(this).redraw.call(this, canvas_ctx);

				// mark as clean
				_(this).dirty = false;

				for (subview_id in __(this).subviews) {
					var subview = __(this).subviews[subview_id];
					subview.redraw(canvas_ctx, true);
				}
			}
			else {
				if (_(this).dirty) {
					// redraw
					_(this).redraw.call(this, canvas_ctx);

					// mark as clean
					_(this).dirty = false;

					// force all children to redraw
					for (subview_id in __(this).subviews) {
						var subview = __(this).subviews[subview_id];
						subview.redraw(canvas_ctx, true);
					}
				}
				else {
					// redraw all children
					for (subview_id in __(this).subviews) {
						var subview = __(this).subviews[subview_id];
						subview.redraw(canvas_ctx, false);
					}
				}
			}
		};

		_protected.redraw = function (canvas_ctx) {
		};

		_protected.subview_add = function (subview_id, subview) {
			__(this).subviews[subview_id] = subview;
			__(this).subviews_count++;
		};

		_protected.subview_get = function (subview_id) {
			return __(this).subviews[subview_id];
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

		prototype.init = function () {
			this.super.init.call(this);

			// create subviews
			__(this).sections_cache = {};
			for (var i = 0; i < spz.client.ui.views_enabled.length; i++) {
				var view_id = spz.client.ui.views_enabled[i];
				_(this).subview_add.call(this, 'nav_button_' + view_id, new spz.client.views.nav_button(this, view_id));
				__(this).sections_cache[view_id] = new spz.client.views[view_id]();
			}

			// add current section subview
			_(this).subview_add.call(this, 'section_' + spz.client.ui.view_current, __(this).sections_cache[spz.client.ui.view_current]);
		};

		prototype.bb_set = function (bb) {
			this.super.bb_set.call(this, bb);

			var settings = __(this).settings[spz.client.ui.orientation];
			var nav_bb = __(this).nav_bb = __(this).settings[spz.client.ui.orientation].nav.to_abs(bb);
			__(this).section_bb = settings.section.to_abs(_(this).bb, false).with_border(settings.section_border);

			if (spz.client.ui.orientation === spz.defines.orientation.landscape) {
				var nav_button_height = Math.floor(nav_bb.height / spz.client.ui.views_enabled.length);
				var nav_button_height_remainder = nav_bb.height % spz.client.ui.views_enabled.length;
				var nav_button_height_used = nav_bb.y;
				for (var i = 0; i < spz.client.ui.views_enabled.length; i++) {
					var view_id = spz.client.ui.views_enabled[i];
					if (i === spz.client.ui.views_enabled.length - 1) {
						nav_button_height += nav_button_height_remainder;
					}
					_(this).subview_get.call(this, 'nav_button_' + view_id).bb_set(new spz.client.objects.bb_abs(nav_bb.x, nav_button_height_used, nav_bb.width, nav_button_height));
					nav_button_height_used += nav_button_height;
				}
			}
			else {
				var nav_button_width = Math.floor(nav_bb.width / spz.client.ui.views_enabled.length);
				var nav_button_width_remainder = nav_bb.width % spz.client.ui.views_enabled.length;
				var nav_button_width_used = nav_bb.x;
				for (var i = 0; i < spz.client.ui.views_enabled.length; i++) {
					var view_id = spz.client.ui.views_enabled[i];
					if (i === spz.client.ui.views_enabled.length - 1) {
						nav_button_width += nav_button_width_remainder;
					}
					_(this).subview_get.call(this, 'nav_button_' + view_id).bb_set(new spz.client.objects.bb_abs(nav_button_width_used, nav_bb.y, nav_button_width, nav_bb.height));
					nav_button_width_used += nav_button_width;
				}
			}

			for (var subview_id in __(this).sections_cache) {
				var subview = __(this).sections_cache[subview_id];
				subview.bb_set(__(this).section_bb);
			}
		};

		prototype.section_change = function (section_new) {
			_(this).subview_remove.call(this, 'section_' + spz.client.ui.view_current);
			spz.client.ui.view_current = section_new;
			_(this).subview_add.call(this, 'section_' + spz.client.ui.view_current, __(this).sections_cache[spz.client.ui.view_current]);
			_(this).dirty = true;
		};

		_protected.redraw = function (canvas_ctx) {
			console.log('redraw root');

			var bb = _(this).bb;
			var nav_bb = __(this).nav_bb;

			canvas_ctx.fillStyle = 'rgb(255, 0, 0)';
			canvas_ctx.fillRect(nav_bb.x, nav_bb.y, nav_bb.width, nav_bb.height);
			canvas_ctx.fillStyle = 'rgb(0, 0, 255)';
			if (spz.client.ui.orientation === spz.defines.orientation.landscape) {
				canvas_ctx.fillRect(nav_bb.width, 0, bb.width - nav_bb.width, bb.height);
			}
			else {
				canvas_ctx.fillRect(0, nav_bb.height, bb.width, bb.height - nav_bb.height);
			}
		};
	});

	spz.client.views.nav_button = spz.client.views.base.subclass(function(prototype, _, _protected, __, __private) {
		// here i discovered that assigning attributes on __private
		// are passed by reference to all children's private prototypes instead of copied :/

		prototype.init = function (parent, view_id) {
			this.super.init.call(this);

			__(this).parent = parent;
			__(this).view_id = view_id;

			__(this).settings = {};
			__(this).settings.rounded_corner = 20;
			__(this).settings.color = spz.helpers.ui.color_random();

			this.event_on.call(this, 'touch_end', __(this).callback_touch_end);
		};

		prototype.bb_set = function (bb) {
			this.super.bb_set.call(this, bb);
		};

		_protected.redraw = function (canvas_ctx) {
			console.log('redraw nav_button_' + __(this).view_id);
			var bb = _(this).bb;

			canvas_ctx.fillStyle = __(this).settings.color;
			canvas_ctx.roundRect(bb.x, bb.y, bb.width, bb.height, __(this).settings.rounded_corner).fill();

			// draw svg
			if (spz.client.resources.view_icons[__(this).view_id].data !== null) {
				var dimension_short = Math.min(bb.width, bb.height);
				var svg_size = dimension_short / 2;
				var svg_x = bb.x + (bb.width - svg_size) / 2;
				var svg_y = bb.y + (bb.height - svg_size) / 2;
				canvas_ctx.drawImage(spz.client.resources.view_icons[__(this).view_id].image, svg_x, svg_y, svg_size, svg_size);
			}
		};

		__private.callback_touch_end = function () {
			__(this).parent.section_change(__(this).view_id);
		};
	});

	spz.client.views[spz.defines.views_available.envelope] = spz.client.views.base.subclass(function(prototype, _, _protected, __, __private) {
		__private.settings = {
		};

		prototype.init = function () {
			this.super.init.call(this);
		};

		prototype.bb_set = function (bb) {
			this.super.bb_set.call(this, bb);
		};

		_protected.redraw = function (canvas_ctx) {
			console.log('redraw envelope');
			var bb = _(this).bb;

			canvas_ctx.fillStyle = 'rgb(255, 255, 0)';
			canvas_ctx.fillRect(bb.x, bb.y, bb.width, bb.height);
			canvas_ctx.fillStyle = 'rgb(0, 0, 0)';
			canvas_ctx.font='30px Georgia';
			canvas_ctx.textBaseline='top';
			canvas_ctx.fillText('envelope', bb.x, bb.y);
		};
	});

	spz.client.views[spz.defines.views_available.patch] = spz.client.views.base.subclass(function(prototype, _, _protected, __, __private) {
		__private.settings = {
		};

		prototype.init = function () {
			this.super.init.call(this);
		};

		prototype.bb_set = function (bb) {
			this.super.bb_set.call(this, bb);
		};

		_protected.redraw = function (canvas_ctx) {
			console.log('redraw patch');
			var bb = _(this).bb;

			canvas_ctx.fillStyle = 'rgb(255, 0, 255)';
			canvas_ctx.fillRect(bb.x, bb.y, bb.width, bb.height);
			canvas_ctx.fillStyle = 'rgb(0, 0, 0)';
			canvas_ctx.font='30px Georgia';
			canvas_ctx.textBaseline='top';
			canvas_ctx.fillText('patch', bb.x, bb.y);
		};
	});

	spz.client.views[spz.defines.views_available.output] = spz.client.views.base.subclass(function(prototype, _, _protected, __, __private) {
		__private.settings = {
		};

		prototype.init = function () {
			this.super.init.call(this);
		};

		prototype.bb_set = function (bb) {
			this.super.bb_set.call(this, bb);
		};

		_protected.redraw = function (canvas_ctx) {
			console.log('redraw output');
			var bb = _(this).bb;

			canvas_ctx.fillStyle = 'rgb(0, 255, 255)';
			canvas_ctx.fillRect(bb.x, bb.y, bb.width, bb.height);
			canvas_ctx.fillStyle = 'rgb(0, 0, 0)';
			canvas_ctx.font='30px Georgia';
			canvas_ctx.textBaseline='top';
			canvas_ctx.fillText('output', bb.x, bb.y);
		};
	});

	spz.client.views[spz.defines.views_available.sounds] = spz.client.views.base.subclass(function(prototype, _, _protected, __, __private) {
		__private.settings = {
		};

		prototype.init = function () {
			this.super.init.call(this);
		};

		prototype.bb_set = function (bb) {
			this.super.bb_set.call(this, bb);
		};

		_protected.redraw = function (canvas_ctx) {
			console.log('redraw sounds');
			var bb = _(this).bb;

			canvas_ctx.fillStyle = 'rgb(0, 127, 127)';
			canvas_ctx.fillRect(bb.x, bb.y, bb.width, bb.height);
			canvas_ctx.fillStyle = 'rgb(0, 0, 0)';
			canvas_ctx.font='30px Georgia';
			canvas_ctx.textBaseline='top';
			canvas_ctx.fillText('sounds', bb.x, bb.y);
		};
	});

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

		prototype.init = function () {
			this.super.init.call(this);
			__(this).midi_note_number_to_bb = {};
			__(this).buffer_dirty = false;
			__(this).recalc_midi_note_number_to_bb.call(this);
			__(this).buffer = document.createElement('canvas');
			__(this).buffer.width = _(this).bb.width;
			__(this).buffer.height = _(this).bb.height;
			__(this).buffer_ctx = __(this).buffer.getContext('2d');

			this.event_on.call(this, 'touch_start', __(this).callback_touch_start);
			this.event_on.call(this, 'touch_move', __(this).callback_touch_move);
			this.event_on.call(this, 'touch_end', __(this).callback_touch_end);
			this.event_on.call(this, 'touch_leave', __(this).callback_touch_leave);
			this.event_on.call(this, 'touch_cancel', __(this).callback_touch_cancel);
		};

		prototype.bb_set = function (bb) {
			this.super.bb_set.call(this, bb);
			__(this).buffer.width = _(this).bb.width;
			__(this).buffer.height = _(this).bb.height;
			__(this).recalc_midi_note_number_to_bb.call(this);
		};

		_protected.redraw = function (canvas_ctx) {
			console.log('redraw keyboard');

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

		__private.callback_touch_start = function (event) {
			for (var i = 0; i < event.changedTouches.length; i++) {
				var touch = event.changedTouches[i];
				var touch_id = touch.identifier;
				var midi_note_number = __(this).touch_to_midi_note_number.call(this, touch);
				if (!(midi_note_number in spz.client.control.midi_note_number_to_touch_id)) {
					spz.server.midi_note_number_on(midi_note_number);
					spz.client.control.midi_note_number_to_touch_id[midi_note_number] = touch_id;
					spz.client.control.touch_id_to_midi_note_number[touch_id] = midi_note_number;
					_(this).dirty = true;
				}
			}
		};

		__private.callback_touch_move = function (event) {
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
						_(this).dirty = true;
					}
				}
			}
		};

		__private.callback_touch_end = function (event) {
			for (var i = 0; i < event.changedTouches.length; i++) {
				var touch_id = event.changedTouches[i].identifier;
				if (touch_id in spz.client.control.touch_id_to_midi_note_number) {
					var midi_note_number = spz.client.control.touch_id_to_midi_note_number[touch_id];
					spz.server.midi_note_number_off(midi_note_number);
					delete spz.client.control.midi_note_number_to_touch_id[midi_note_number];
					delete spz.client.control.touch_id_to_midi_note_number[touch_id];
					_(this).dirty = true;
				}
			}
		};

		__private.callback_touch_leave = function (event) {
			for (var i = 0; i < event.changedTouches.length; i++) {
				var touch_id = event.changedTouches[i].identifier;
				if (touch_id in spz.client.control.touch_id_to_midi_note_number) {
					var midi_note_number = spz.client.control.touch_id_to_midi_note_number[touch_id];
					spz.server.midi_note_number_off(midi_note_number);
					delete spz.client.control.midi_note_number_to_touch_id[midi_note_number];
					delete spz.client.control.touch_id_to_midi_note_number[touch_id];
					_(this).dirty = true;
				}
			}
		};

		__private.callback_touch_cancel = function (event) {
			for (var i = 0; i < event.changedTouches.length; i++) {
				var touch_id = event.changedTouches[i].identifier;
				if (touch_id in spz.client.control.touch_id_to_midi_note_number) {
					var midi_note_number = spz.client.control.touch_id_to_midi_note_number[touch_id];
					spz.server.midi_note_number_off(midi_note_number);
					delete spz.client.control.midi_note_number_to_touch_id[midi_note_number];
					delete spz.client.control.touch_id_to_midi_note_number[touch_id];
					_(this).dirty = true;
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

})(window.spz, window.mozart);
