(function (spz, capp) {
	spz.client.components = spz.client.components || {};

	var views_available = spz.defines.views_available;

	/*
		text button component
	*/

	var labeled_slider = capp.component.extend({
		constructor: function (text) {

		},
	});

	var label = capp.component.extend({
		__settings: {
			font: 'pt monospace'
		},

		constructor: function (text) {
			capp.component.prototype.constructor.call(this);
			this.__text = text;
		},

		_redraw: function (canvas_ctx) {
			var bb = this._bb;
			var text = this.__text;

			// text options
			canvas_ctx.fillStyle = 'rgb(255, 255, 255)';
			canvas_ctx.textBaseline = 'middle';
			canvas_ctx.textAlign = 'center';

			// fit text
			var text_height = bb.height;
			canvas_ctx.font = text_height.toString() + 'pt monospace';
			var text_width = canvas_ctx.measureText(text).width;
			var max_width = bb.width;
			while (text_width > max_width) {
				text_height *= 0.9;
				canvas_ctx.font = text_height.toString() + 'pt monospace';
				text_width = canvas_ctx.measureText(text).width;
			}

			// draw text
			canvas_ctx.fillText(this.__text, bb.x + (bb.width / 2), bb.y + (bb.height / 2));
		}
	});

	var button_text = capp.component.extend({
		__settings: {
			rounded_corner: 20
		},

		constructor: function (text) {
			capp.component.prototype.constructor.call(this);
			this.__text = text;
		},

		_redraw: function (canvas_ctx) {
			var bb = this._bb;
			var text = this.__text;

			// draw button
			canvas_ctx.fillStyle = 'rgb(0, 0, 0)';
			canvas_ctx.roundRect(bb.x, bb.y, bb.width, bb.height, this.__settings.rounded_corner).fill();

			// text options
			canvas_ctx.fillStyle = 'rgb(255, 255, 255)';
			canvas_ctx.textBaseline = 'middle';
			canvas_ctx.textAlign = 'center';

			// fit text
			var text_height = bb.height * 0.8;
			canvas_ctx.font = text_height.toString() + 'pt monospace';
			var text_width = canvas_ctx.measureText(text).width;
			var max_width = bb.width * 0.8;
			while (text_width > max_width) {
				text_height *= 0.8;
				canvas_ctx.font = text_height.toString() + 'pt monospace';
				text_width = canvas_ctx.measureText(text).width;
			}

			// draw text
			canvas_ctx.fillText(this.__text, bb.x + (bb.width / 2), bb.y + (bb.height / 2));
		}
	});

	var slider = capp.component.extend({
		constructor: function (value, min, max, step) {
			capp.component.prototype.constructor.call(this);

			this.__settings = {};
			this.__settings.bar_color = 'rgb(127, 127, 127)';
			this.__settings.bar_corner_rounded = 5;
			this.__settings.handle_color = 'rgb(0, 0, 0)';
			this.__settings.handle_corner_rounded = 5;

			this.__min = min || 0.0;
			this.__max = max || 1.0;
			this.__range = this.__max - this.__min;
			this.step_set(step || 0.0);
			this.value_set(value || this.__min);

			this.__held = false;

			_.bindAll(this, '__callback_touch_start', '__callback_touch_move', '__callback_touch_end');

			this.event_on__('touch_start', this.__callback_touch_start);
			this.event_on__('touch_move', this.__callback_touch_move);
			this.event_on__('touch_end', this.__callback_touch_end);
			this.event_on__('touch_leave', this.__callback_touch_end);
			this.event_on__('touch_cancel', this.__callback_touch_end);
		},

		value_set: function (_value) {
			this.__value_internal = this.__value_external_to_internal(_value);
		},

		value_get: function () {
			return this.__value_internal_to_external(this.__value_internal);
		},

		step_set: function (_step) {
			this.__step_internal = this.__value_external_to_internal(_step);
			if (_step === 0.0) {
				this.__settings.handle_width_rel = 0.2;
			}
			else {
				this.__settings.handle_width_rel = this.__step_internal;
			}
		},

		step_get: function () {
			return this.__value_internal_to_external(this.__step);
		},

		_redraw: function (canvas_ctx) {
			console.log('redrawing slider');

			var settings = this.__settings;
			var bb = this._bb;

			// draw bar (full bb for now)
			canvas_ctx.fillStyle = settings.bar_color;
			canvas_ctx.roundRect(bb.x, bb.y, bb.width, bb.height, this.__settings.bar_corner_rounded).fill();

			// draw handle
			canvas_ctx.fillStyle = settings.handle_color;
			var handle_width = bb.width * this.__settings.handle_width_rel;
			var handle_x = this.__value_internal_to_canvas_pos(this.__value_internal);
			canvas_ctx.roundRect(handle_x, bb.y, handle_width, bb.height, this.__settings.handle_corner_rounded).fill();
		},

		// internal values are [0, 1]
		// external values are [this.__min, this.__max]
		__value_internal_to_external: function (value_internal) {
			return spz.helpers.clip((value_internal * (this.__range)) + this.__min, this.__min, this.__max);
		},

		__value_external_to_internal: function (value_external) {
			return (value_external - this.__min) / this.__range;
		},

		__canvas_pos_to_value_internal: function (canvas_x) {
			var bb = this._bb;
			var handle_width_rel_half = this.__settings.handle_width_rel / 2;
			var x = canvas_x - bb.x;
			var range_map = spz.helpers.range_map_linear(handle_width_rel_half, bb.width - handle_width_rel_half, 0.0, 1.0);
			var value = x * range_map.m + range_map.b;
			var step = this.__step_internal;
			if (step !== 0.0) {
				value = Math.round(value / step) * step;
			}
			value = spz.helpers.clip(value, 0.0, 1.0);

			return value;
		},

		__value_internal_to_canvas_pos: function (canvas_x) {
			var bb = this._bb;
			var offset_x_max = ((1.0 - this.__settings.handle_width_rel) * bb.width);
			var offset_x = this.__value_internal * offset_x_max;
			offset_x = spz.helpers.clip(offset_x, 0, offset_x_max);
			return bb.x + offset_x;
		},

		__callback_touch_start: function (event) {
			this.__held = true;
			var value_internal_old = this.__value_internal;
			touch_event = event.changedTouches[0];
			this.__value_internal = this.__canvas_pos_to_value_internal(touch_event.clientX, touch_event.clientY);
			if (value_internal_old !== this.__value_internal) {
				this.event_trigger__('slider_change', this);
				this._dirty = true;
			}
		},

		__callback_touch_move: function (event) {
			if (this.__held) {
				var value_internal_old = this.__value_internal;
				touch_event = event.changedTouches[0];
				this.__value_internal = this.__canvas_pos_to_value_internal(touch_event.clientX, touch_event.clientY);
				if (value_internal_old !== this.__value_internal) {
					this.event_trigger__('slider_change', this);
					this._dirty = true;
				}
			}
		},

		__callback_touch_end: function (event) {
			this.__held = false;
		}
	});

	spz.client.components.root = capp.component.extend({
		constructor: function () {
			capp.component.prototype.constructor.call(this);

			// settings
			this.__settings = {};
			this.__settings[spz.defines.orientation.landscape] = {};
			this.__settings[spz.defines.orientation.portrait] = {};
			this.__settings[spz.defines.orientation.landscape].nav = new capp.bb_rel(
				0.0,
				0.0,
				0.2,
				1.0
			);
			this.__settings[spz.defines.orientation.landscape].section = new capp.bb_rel(
				0.2,
				0.0,
				0.8,
				1.0
			);
			this.__settings[spz.defines.orientation.landscape].section_border = 0.02;
			this.__settings[spz.defines.orientation.portrait].nav = new capp.bb_rel(
				0.0,
				0.0,
				1.0,
				0.2
			);
			this.__settings[spz.defines.orientation.portrait].section = new capp.bb_rel(
				0.0,
				0.2,
				1.0,
				0.8
			);
			this.__settings[spz.defines.orientation.portrait].section_border = 0.02;

			// create subcomponents
			this.__sections_cache = {};
			for (var i = 0; i < spz.client.ui.views_enabled.length; i++) {
				var view_id = spz.client.ui.views_enabled[i];
				this._subcomponent_add__('nav_button_' + view_id, new spz.client.components.nav_button(this, view_id));
				this.__sections_cache[view_id] = new spz.client.components[view_id]();
			}

			// add current section subcomponent
			this._subcomponent_add__('section_' + spz.client.ui.view_current, this.__sections_cache[spz.client.ui.view_current]);
		},

		bb_set: function (bb) {
			capp.component.prototype.bb_set.call(this, bb);

			var settings = this.__settings[spz.client.ui.orientation];
			var nav_bb = this.__nav_bb = this.__settings[spz.client.ui.orientation].nav.to_abs(bb);
			this.__section_bb = settings.section.to_abs(this._bb, false).with_border(settings.section_border, settings.section_border);

			if (spz.client.ui.orientation === spz.defines.orientation.landscape) {
				var nav_button_height = Math.floor(nav_bb.height / spz.client.ui.views_enabled.length);
				var nav_button_height_remainder = nav_bb.height % spz.client.ui.views_enabled.length;
				var nav_button_height_used = nav_bb.y;
				for (var i = 0; i < spz.client.ui.views_enabled.length; i++) {
					var view_id = spz.client.ui.views_enabled[i];
					if (i === spz.client.ui.views_enabled.length - 1) {
						nav_button_height += nav_button_height_remainder;
					}
					this._subcomponent_get__('nav_button_' + view_id).bb_set(new capp.bb_abs(nav_bb.x, nav_button_height_used, nav_bb.width, nav_button_height));
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
					this._subcomponent_get__('nav_button_' + view_id).bb_set(new capp.bb_abs(nav_button_width_used, nav_bb.y, nav_button_width, nav_bb.height));
					nav_button_width_used += nav_button_width;
				}
			}

			for (var subview_id in this.__sections_cache) {
				var subcomponent = this.__sections_cache[subview_id];
				subcomponent.bb_set(this.__section_bb);
			}
		},

		section_change: function (section_new) {
			this._subcomponent_remove__('section_' + spz.client.ui.view_current);
			spz.client.ui.view_current = section_new;
			this.__sections_cache[spz.client.ui.view_current].bb_set(this.__section_bb);
			this._subcomponent_add__('section_' + spz.client.ui.view_current, this.__sections_cache[spz.client.ui.view_current]);
			this._dirty = true;
		},

		_redraw: function (canvas_ctx) {
			console.log('redraw root');

			var bb = this._bb;
			var nav_bb = this.__nav_bb;

			canvas_ctx.fillStyle = 'rgb(255, 0, 0)';
			canvas_ctx.fillRect(nav_bb.x, nav_bb.y, nav_bb.width, nav_bb.height);
			canvas_ctx.fillStyle = 'rgb(0, 0, 255)';
			if (spz.client.ui.orientation === spz.defines.orientation.landscape) {
				canvas_ctx.fillRect(nav_bb.width, 0, bb.width - nav_bb.width, bb.height);
			}
			else {
				canvas_ctx.fillRect(0, nav_bb.height, bb.width, bb.height - nav_bb.height);
			}
		}
	});

	spz.client.components.nav_button = capp.component.extend({
		// here i discovered that assigning attributes on __private
		// are passed by reference to all children's private prototypes instead of copied :/

		constructor: function (parent, view_id) {
			capp.component.prototype.constructor.call(this);

			this.__parent = parent;
			this.__view_id = view_id;

			this.__settings = {};
			this.__settings.rounded_corner = 20;
			this.__settings.color = spz.helpers.ui.color_random();

			this.event_on__('touch_end', _.bind(this.__callback_touch_end, this));
		},

		bb_set: function (bb) {
			capp.component.prototype.bb_set.call(this, bb);
		},

		_redraw: function (canvas_ctx) {
			console.log('redraw nav_button_' + this.__view_id);
			var bb = this._bb;

			canvas_ctx.fillStyle = this.__settings.color;
			canvas_ctx.roundRect(bb.x, bb.y, bb.width, bb.height, this.__settings.rounded_corner).fill();

			// draw svg
			if (spz.client.ui.view_icons_use) {
				if (spz.client.resources.view_icons[this.__view_id].image !== null) {
					var dimension_short = Math.min(bb.width, bb.height);
					var svg_size = dimension_short * 0.75;
					var svg_x = bb.x + (bb.width - svg_size) / 2;
					var svg_y = bb.y + (bb.height - svg_size) / 2;
					canvas_ctx.drawImage(spz.client.resources.view_icons[this.__view_id].image, svg_x, svg_y, svg_size, svg_size);
				}
			}
		},

		__callback_touch_end: function () {
			this.__parent.section_change(this.__view_id);
		}
	});

	spz.client.components[views_available.keyboard] = capp.component.extend({
		constructor: function () {
			capp.component.prototype.constructor.call(this);

			this.__settings = {};
			this.__settings.controls = {}
			this.__settings.controls.bb = new capp.bb_rel(
				0.0,
				0.0,
				1.0,
				0.2
			);
			this.__settings.keyboard = new capp.bb_rel(
				0.0,
				0.2,
				1.0,
				0.8
			);

			// keyboard
			var _keyboard = new keyboard();

			// zoom out button
			var zoom_out = new button_text('-');
			this._subcomponent_add__('zoom_out', zoom_out);
			zoom_out.event_on__('touch_end', _keyboard.zoom_out);

			//this._subcomponent_add__.call(this, 'octave_down', new button_text('+'));
			//this._subcomponent_add__.call(this, 'octave_up', new button_text('+'));
			//this._subcomponent_add__.call(this, 'zoom_in', new button_text('+'));
			this._subcomponent_add__('keyboard', _keyboard);
		},

		bb_set: function (bb) {
			capp.component.prototype.bb_set.call(this, bb);
			var settings = this.__settings;
			var bb_controls = settings.controls.bb.to_abs(bb);
			var bb_keyboard = settings.keyboard.to_abs(bb);

			this._subcomponent_get__('keyboard').bb_set(bb_keyboard);
			this._subcomponent_get__('zoom_out').bb_set(bb_controls);
		}
	});

	spz.client.components[views_available.envelope] = capp.component.extend({
		constructor: function () {
			capp.component.prototype.constructor.call(this);

			this.__settings = {};
			this.__settings.color = spz.helpers.ui.color_random();

			this.__settings.label_width_rel = 0.2;

			this.__sliders = {};
			this.__sliders.attack = new slider(spz.client.control[views_available.envelope].attack, 0.0, 1.0);
			this.__sliders.decay = new slider(spz.client.control[views_available.envelope].decay, 0.0, 1.0);
			this.__sliders.sustain = new slider(spz.client.control[views_available.envelope].sustain, 0.0, 1.0);
			this.__sliders.release = new slider(spz.client.control[views_available.envelope].release, 0.0, 1.0);

			this._subcomponent_add__('label_attack', new label('Atk'));
			this._subcomponent_add__('slider_attack', this.__sliders.attack);
			this._subcomponent_add__('label_decay', new label('Dcy'));
			this._subcomponent_add__('slider_decay', this.__sliders.decay);
			this._subcomponent_add__('label_sustain', new label('Sus'));
			this._subcomponent_add__('slider_sustain', this.__sliders.sustain);
			this._subcomponent_add__('label_release', new label('Rel'));
			this._subcomponent_add__('slider_release', this.__sliders.release);

			this.__sliders.attack.event_on__('slider_change', function (slider) {
				var value_new = slider.value_get();
				spz.client.control[views_available.envelope].attack = value_new;
				spz.server.osc[views_available.envelope].change_attack(value_new);
			});

			this.__sliders.decay.event_on__('slider_change', function (slider) {
				var value_new = slider.value_get();
				spz.client.control[views_available.envelope].decay = value_new;
				spz.server.osc[views_available.envelope].change_decay(value_new);
			});

			this.__sliders.sustain.event_on__('slider_change', function (slider) {
				var value_new = slider.value_get();
				spz.client.control[views_available.envelope].sustain = value_new;
				spz.server.osc[views_available.envelope].change_sustain(value_new);
			});

			this.__sliders.release.event_on__('slider_change', function (slider) {
				var value_new = slider.value_get();
				spz.client.control[views_available.envelope].release = value_new;
				spz.server.osc[views_available.envelope].change_release(value_new);
			});
		},

		bb_set: function (bb) {
			capp.component.prototype.bb_set.call(this, bb);

			var label_attack_bb = (new capp.bb_rel(0.0, 0.0, 0.2, 0.25)).to_abs(bb).with_border(0.1, 0.1);
			this._subcomponent_get__('label_attack').bb_set(label_attack_bb);
			var label_decay_bb = (new capp.bb_rel(0.0, 0.25, 0.2, 0.25)).to_abs(bb).with_border(0.1, 0.1);
			this._subcomponent_get__('label_decay').bb_set(label_decay_bb);
			var label_sustain_bb = (new capp.bb_rel(0.0, 0.5, 0.2, 0.25)).to_abs(bb).with_border(0.1, 0.1);
			this._subcomponent_get__('label_sustain').bb_set(label_sustain_bb);
			var label_release_bb = (new capp.bb_rel(0.0, 0.75, 0.2, 0.25)).to_abs(bb).with_border(0.1, 0.1);
			this._subcomponent_get__('label_release').bb_set(label_release_bb);

			var slider_attack_bb = (new capp.bb_rel(0.2, 0.0, 0.8, 0.25)).to_abs(bb).with_border(0.1, 0.1);
			this.__sliders.attack.bb_set(slider_attack_bb);
			var slider_decay_bb = (new capp.bb_rel(0.2, 0.25, 0.8, 0.25)).to_abs(bb).with_border(0.1, 0.1);
			this.__sliders.decay.bb_set(slider_decay_bb);
			var slider_sustain_bb = (new capp.bb_rel(0.2, 0.5, 0.8, 0.25)).to_abs(bb).with_border(0.1, 0.1);
			this.__sliders.sustain.bb_set(slider_sustain_bb);
			var slider_release_bb = (new capp.bb_rel(0.2, 0.75, 0.8, 0.25)).to_abs(bb).with_border(0.1, 0.1);
			this.__sliders.release.bb_set(slider_release_bb);
		},

		_redraw: function (canvas_ctx) {
			console.log('redraw envelope');
			var bb = this._bb;

			canvas_ctx.fillStyle = this.__settings.color;
			canvas_ctx.fillRect(bb.x, bb.y, bb.width, bb.height);
		}
	});

	spz.client.components[views_available.patch] = capp.component.extend({
		constructor: function () {
			capp.component.prototype.constructor.call(this);

			this.__settings = {};
			this.__settings.color = spz.helpers.ui.color_random();
		},

		bb_set: function (bb) {
			capp.component.prototype.bb_set.call(this, bb);
		},

		_redraw: function (canvas_ctx) {
			console.log('redraw patch');
			var bb = this._bb;

			canvas_ctx.fillStyle = this.__settings.color;
			canvas_ctx.fillRect(bb.x, bb.y, bb.width, bb.height);
		}
	});

	spz.client.components[views_available.sounds] = capp.component.extend({
		constructor: function () {
			capp.component.prototype.constructor.call(this);

			this.__settings = {};
			this.__settings.color = spz.helpers.ui.color_random();
		},

		bb_set: function (bb) {
			capp.component.prototype.bb_set.call(this, bb);
		},

		_redraw: function (canvas_ctx) {
			console.log('redraw sounds');
			var bb = this._bb;

			canvas_ctx.fillStyle = this.__settings.color;
			canvas_ctx.fillRect(bb.x, bb.y, bb.width, bb.height);
		}
	});

	spz.client.components[views_available.output] = capp.component.extend({
		constructor: function () {
			capp.component.prototype.constructor.call(this);

			this.__settings = {};

			this.__settings.label_width_rel = 0.2;

			this.__sliders = {};
			this.__sliders.volume = new slider(spz.client.control[views_available.output].volume, 0.0, 1.0, 0.05);
			this.__sliders.pan = new slider(spz.client.control[views_available.output].pan, 0.0, 1.0, 0.1);

			this._subcomponent_add__('label_volume', new label('Vol'));
			this._subcomponent_add__('slider_volume', this.__sliders.volume);
			this._subcomponent_add__('label_pan', new label('Pan'));
			this._subcomponent_add__('slider_pan', this.__sliders.pan);

			this.__sliders.volume.event_on__('slider_change', function (slider) {
				var value_new = slider.value_get();
				spz.client.control[views_available.output].volume = value_new;
				spz.server.osc[views_available.output].change_volume(value_new);
			});

			this.__sliders.pan.event_on__('slider_change', function (slider) {
				var value_new = slider.value_get();
				spz.client.control[views_available.output].pan = value_new;
				spz.server.osc[views_available.output].change_pan(value_new);
			});
		},

		bb_set: function (bb) {
			capp.component.prototype.bb_set.call(this, bb);

			var label_volume_bb = (new capp.bb_rel(0.0, 0.25, 0.2, 0.25)).to_abs(bb).with_border(0.1, 0.1);
			this._subcomponent_get__('label_volume').bb_set(label_volume_bb);
			var label_pan_bb = (new capp.bb_rel(0.0, 0.50, 0.2, 0.25)).to_abs(bb).with_border(0.1, 0.1);
			this._subcomponent_get__('label_pan').bb_set(label_pan_bb);

			var slider_volume_bb = (new capp.bb_rel(0.2, 0.25, 0.8, 0.25)).to_abs(bb).with_border(0.1, 0.1);
			this.__sliders.volume.bb_set(slider_volume_bb);
			var slider_pan_bb = (new capp.bb_rel(0.2, 0.50, 0.8, 0.25)).to_abs(bb).with_border(0.1, 0.1);
			this.__sliders.pan.bb_set(slider_pan_bb);
		},

		_redraw: function (canvas_ctx) {
			console.log('redraw output');
			var bb = this._bb;

			canvas_ctx.fillStyle = this.__settings.color;
			canvas_ctx.fillRect(bb.x, bb.y, bb.width, bb.height);
		}
	});

	var keyboard = capp.component.extend({
		constructor: function () {
			capp.component.prototype.constructor.call(this);

			this.__settings = {
				key_spacing: 0.02,
				key_white_color: 'rgb(255, 255, 255)',
				key_white_down_color: 'rgb(10, 46, 166)',
				key_white_outline: 'rgb(50, 50, 50)',
				key_black_color: 'rgb(0, 0, 0)',
				key_black_down_color: 'rgb(245, 209, 89)',
				key_black_outline: 'rgb(50, 50, 50)'
			};

			this.__midi_note_number_to_bb = {};
			this.__buffer_dirty = false;
			this.__recalc_midi_note_number_to_bb();
			this.__buffer = document.createElement('canvas');
			this.__buffer.width = this._bb.width;
			this.__buffer.height = this._bb.height;
			this.__buffer_ctx = this.__buffer.getContext('2d');

			_.bindAll(this, '__callback_touch_start', '__callback_touch_move', '__callback_touch_end', '__callback_touch_leave', '__callback_touch_cancel', 'zoom_out');

			this.event_on__('touch_start', this.__callback_touch_start);
			this.event_on__('touch_move', this.__callback_touch_move);
			this.event_on__('touch_end', this.__callback_touch_end);
			this.event_on__('touch_leave', this.__callback_touch_leave);
			this.event_on__('touch_cancel', this.__callback_touch_cancel);

			this.__touch_id_to_midi_note_number = {};
			this.__midi_note_number_to_touch_id = {};
		},

		zoom_out: function () {
			if (spz.client.ui.keyboard.midi_octaves_displayed < 6) {
				spz.client.ui.keyboard.midi_octaves_displayed += 1;
				this.__recalc_midi_note_number_to_bb();
				this._dirty = true;
			}
		},

		bb_set: function (bb) {
			capp.component.prototype.bb_set.call(this, bb);
			this.__buffer.width = this._bb.width;
			this.__buffer.height = this._bb.height;
			this.__recalc_midi_note_number_to_bb();
		},

		_redraw: function (canvas_ctx) {
			console.log('redraw keyboard');

			var bb = this._bb;
			var settings = this.__settings;

			// get canvas dimensions
			var canvas_width = bb.width;
			var canvas_height = bb.height;
			var canvas_buffer = this.__buffer;

			var midi_note_number_lower = spz.client.ui.keyboard.midi_octave * 12;
			var midi_note_number_upper = midi_note_number_lower + (spz.client.ui.keyboard.midi_octaves_displayed * 12) - 1;

			var midi_note_number_to_bb = this.__midi_note_number_to_bb;

			// redraw buffer if we need to
			if (this.__buffer_dirty) {
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
				this.__buffer_dirty = false;
			}

			// fill in canvas from buffer
			canvas_ctx.drawImage(canvas_buffer, bb.x, bb.y);

			// highlight selected note
			for (var midi_note_number_string in this.__midi_note_number_to_touch_id) {
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
		},

		__callback_touch_start: function (event) {
			for (var i = 0; i < event.changedTouches.length; i++) {
				var touch = event.changedTouches[i];
				var touch_id = touch.identifier;
				var midi_note_number = this.__touch_to_midi_note_number(touch);
				if (!(midi_note_number in this.__midi_note_number_to_touch_id)) {
					spz.server.osc[views_available.keyboard].midi_note_number_on(midi_note_number);
					this.__midi_note_number_to_touch_id[midi_note_number] = touch_id;
					this.__touch_id_to_midi_note_number[touch_id] = midi_note_number;
					this._dirty = true;
				}
			}
		},

		__callback_touch_move: function (event) {
			for (var i = 0; i < event.changedTouches.length; i++) {
				var touch = event.changedTouches[i];
				var touch_id = touch.identifier;
				var midi_note_number = this.__touch_to_midi_note_number(touch);
				if (touch_id in this.__touch_id_to_midi_note_number) {
					var midi_note_number_old = this.__touch_id_to_midi_note_number[touch_id];
					if (midi_note_number_old !== midi_note_number) {
						spz.server.osc[views_available.keyboard].midi_note_number_off(midi_note_number_old);
						delete this.__midi_note_number_to_touch_id[midi_note_number_old];
						delete this.__touch_id_to_midi_note_number[touch_id];
						spz.server.osc[views_available.keyboard].midi_note_number_on(midi_note_number);
						this.__midi_note_number_to_touch_id[midi_note_number] = touch_id;
						this.__touch_id_to_midi_note_number[touch_id] = midi_note_number;
						this._dirty = true;
					}
				}
			}
		},

		__callback_touch_end: function (event) {
			for (var i = 0; i < event.changedTouches.length; i++) {
				var touch_id = event.changedTouches[i].identifier;
				if (touch_id in this.__touch_id_to_midi_note_number) {
					var midi_note_number = this.__touch_id_to_midi_note_number[touch_id];
					spz.server.osc[views_available.keyboard].midi_note_number_off(midi_note_number);
					delete this.__midi_note_number_to_touch_id[midi_note_number];
					delete this.__touch_id_to_midi_note_number[touch_id];
					this._dirty = true;
				}
			}
		},

		__callback_touch_leave: function (event) {
			for (var i = 0; i < event.changedTouches.length; i++) {
				var touch_id = event.changedTouches[i].identifier;
				if (touch_id in this.__touch_id_to_midi_note_number) {
					var midi_note_number = this.__touch_id_to_midi_note_number[touch_id];
					spz.server.osc[views_available.keyboard].midi_note_number_off(midi_note_number);
					delete this.__midi_note_number_to_touch_id[midi_note_number];
					delete this.__touch_id_to_midi_note_number[touch_id];
					this._dirty = true;
				}
			}
		},

		__callback_touch_cancel: function (event) {
			for (var i = 0; i < event.changedTouches.length; i++) {
				var touch_id = event.changedTouches[i].identifier;
				if (touch_id in this.__touch_id_to_midi_note_number) {
					var midi_note_number = this.__touch_id_to_midi_note_number[touch_id];
					spz.server.osc[views_available.keyboard].midi_note_number_off(midi_note_number);
					delete this.__midi_note_number_to_touch_id[midi_note_number];
					delete this.__touch_id_to_midi_note_number[touch_id];
					this._dirty = true;
				}
			}
		},

		__touch_to_midi_note_number: function (touch) {
			var bb = this._bb;
			var x = touch.clientX - bb.x;
			var y = touch.clientY - bb.y;

			var midi_note_number_lower = spz.client.ui.keyboard.midi_octave * 12;
			var midi_note_number_upper = midi_note_number_lower + (spz.client.ui.keyboard.midi_octaves_displayed * 12) - 1;

			var midi_note_number_to_bb = this.__midi_note_number_to_bb;

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
		},

		__recalc_midi_note_number_to_bb: function () {
			var midi_note_number_lower = spz.client.ui.keyboard.midi_octave * 12;
			var midi_note_number_upper = midi_note_number_lower + (spz.client.ui.keyboard.midi_octaves_displayed * 12) - 1;
			var bb = this._bb;

			this.__midi_note_number_to_bb = {};

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
				var bb_key = new capp.bb_abs();

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

				this.__midi_note_number_to_bb[midi_note_number] = bb_key;
			}

			this.__buffer_dirty = true;
		}
	});

})(window.spz, window.capp);
