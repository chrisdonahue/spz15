(function (spz, $) {
	/*
		check for necessary APIs
	*/

	// return if no support for websocket or canvas
	if (!window.supports_websocket) {
		alert('Sorry, WebSocket not supported on this browser.');
		throw 'WebSocket not supported on this browser';
	}
	if (!window.supports_canvas) {
		alert('Sorry, HTML5 Canvas not supported on this browser.');
		throw 'HTML5 Canvas not supported on this browser';
	}

	/*
		namespacing
	*/
	
	spz.client = spz.client || {};
	spz.client.control = spz.client.control || {};
	spz.client.ui = spz.client.ui || {};
	
	/*
		defines
	*/
	
	spz.client.defines = {
		touch_id_mouse: 'mouse'
	};

	/*
		control state
	*/
	
	$.extend(spz.client.control, spz.client.options.control);
	
	$.extend(spz.client.control, {
			midi_note_number_to_touch_id: {},
			touch_id_to_midi_note_number: {},
			midi_note_velocity: 100
	});
	
	/*
		ui state
	*/
	
	$.extend(spz.client.ui, spz.client.options.ui);

	/*
	helpers.ui.midi_note_number_to_bounding_box_recalculate = function() {
		state.ui.midi_note_number_to_bounding_box = {};

		// count white keys
		var keys_white_total = 0;
		for (var midi_note_number = state.ui.midi_note_number_display_lower; midi_note_number <= state.ui.midi_note_number_display_upper; midi_note_number++) {
			if (helpers.midi.note_number_key_white_is(midi_note_number)) {
				keys_white_total++;
			}
		}

		// create bounding boxes
		var key_white_width = Math.floor(state.ui.canvas_width_px / keys_white_total);
		var canvas_width_remainder = Math.floor(state.ui.canvas_width_px % keys_white_total);
		var key_white_width_extra_every = Math.floor(keys_white_total / canvas_width_remainder);
		var key_white_height = state.ui.canvas_height_px;
		var key_black_width = key_white_width * 0.7;
		var key_black_height = key_white_height * 0.6;
		var key_black_offset = key_white_width * 0.35;
		var keys_white_calculated = 0;
		var keys_black_calculated = 0;
		var canvas_width_covered = 0;
		for (midi_note_number = state.ui.midi_note_number_display_lower; midi_note_number <= state.ui.midi_note_number_display_upper; midi_note_number++) {
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

			state.ui.midi_note_number_to_bounding_box[midi_note_number] = bounding_box;
		}
		
		// mark 
		state.ui.canvas_buffer_dirty = true;
	};

	helpers.ui.midi_note_number_to_bounding_box = function(midi_note_number) {
		// return cached result
		if (state.ui.midi_note_number_to_bounding_box !== null) {
			if (midi_note_number in state.ui.midi_note_number_to_bounding_box) {
				return state.ui.midi_note_number_to_bounding_box[midi_note_number];
			}
			else {
				return null;
			}
		}
		throw 'helpers.ui.note_number_to_bounding_box: called before helpers.ui.note_number_to_bounding_box_recalculate';
	};

	helpers.ui.note_number_display_range_set = function(lower, upper) {
		if (lower > upper) {
			throw 'helpers.ui.note_number_display_range_set: value range invalid';
		}
		state.ui.midi_note_number_display_lower = lower;
		state.ui.midi_note_number_display_upper = upper;
		helpers.ui.midi_note_number_to_bounding_box_recalculate();
	};

	helpers.ui.intersect_bounding_box = function(x, y, bounding_box) {
		return (bounding_box.x <= x && x < bounding_box.x + bounding_box.width) && (bounding_box.y <= y && y < bounding_box.y + bounding_box.height);
	};

	helpers.ui.mouse_event_to_canvas_pos = function(event) {
		return {
			x: event.clientX - state.ui.canvas_left_px,
			y: event.clientY - state.ui.canvas_top_px
		};
	};

	helpers.ui.touch_to_canvas_pos = function(touch) {
		return {
			x: touch.clientX - state.ui.canvas_left_px,
			y: touch.clientY - state.ui.canvas_top_px
		};
	};

	helpers.ui.canvas_pos_to_midi_note_number = function (pos) {
		var x = pos.x;
		var y = pos.y;

		// try black keys
		for (var midi_note_number = state.ui.midi_note_number_display_lower; midi_note_number <= state.ui.midi_note_number_display_upper; midi_note_number++) {
			if (helpers.midi.note_number_key_white_is(midi_note_number)) {
				continue;
			}

			var bb = helpers.ui.midi_note_number_to_bounding_box(midi_note_number);
			if (helpers.ui.intersect_bounding_box(x, y, bb)) {
				return midi_note_number;
			}
		}

		// try white keys
		for (var midi_note_number = state.ui.midi_note_number_display_lower; midi_note_number <= state.ui.midi_note_number_display_upper; midi_note_number++) {
			if (helpers.midi.note_number_key_black_is(midi_note_number)) {
				continue;
			}

			var bb = helpers.ui.midi_note_number_to_bounding_box(midi_note_number);
			if (helpers.ui.intersect_bounding_box(x, y, bb)) {
				return midi_note_number;
			}
		}

		// no note pressed (this shouldn't happen)
		return null;
	};

	// client helpers
	helpers.client = {};

	helpers.client.midi_note_number_on = function (midi_note_number) {
		socket.send('on ' + String(midi_note_number) + ' ' + String(state.client.midi_note_velocity));
	};

	helpers.client.midi_note_number_off = function (midi_note_number) {
		socket.send('off ' + String(midi_note_number));
	};

		*/

	/*
		socket
	*/

	/*
		ui
	*/

	// ui callbacks
	var callback_ui_window_resize = function (canvas) {
		return function (event) {
			var browser_viewport_width = $(window).width();
			var browser_viewport_height = $(window).height();
			canvas.width = browser_viewport_width;
			canvas.height = browser_viewport_height;
		};
	};

	var callback_document_ready = function () {
		// remove scrollbars
		$('body').css({'overflow': 'hidden'});
		
		// create fabric canvas
		var canvas = $('div#canvas canvas#client_ui').get(0);
		
		// register window resize callback
		callback_ui_window_resize(canvas)();
		$(window).resize(callback_ui_window_resize(canvas));

		// create views
		var view_keyboard = new spz.client.views.keyboard(10, 20, 20, 20);
		
		// register document ready callback
		$(document).ready(callback_document_ready);
	}	
})(window.spz, window.jQuery);
