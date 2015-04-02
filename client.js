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
		ui
	*/

	// ui callbacks
	var callback_ui_window_resize = function () {
		var browser_viewport_width = $(window).width();
		var browser_viewport_height = $(window).height();
		spz.client.ui.canvas.width = browser_viewport_width;
		spz.client.ui.canvas.height = browser_viewport_height;
		spz.client.ui.root.redraw();
		callback_ui_redraw();
	};

	var callback_ui_canvas_mouse_move = function (event) {
	};

	var callback_ui_canvas_mouse_down = function (event) {
	};

	var callback_ui_canvas_mouse_up = function (event) {
	};

	var callback_ui_canvas_mouse_leave = function (event) {
	};

	var _callback_ui_canvas_touch_shim = function (callback) {
		return function(event) {
			if (!('targetTouches' in event)) {
				event = event.originalEvent;
			}
			callback(event);
		};
	};

	var callback_ui_canvas_touch_start = _callback_ui_canvas_touch_shim(function (event) {
	});

	var callback_ui_canvas_touch_move = _callback_ui_canvas_touch_shim(function (event) {
	});

	var callback_ui_canvas_touch_end = _callback_ui_canvas_touch_shim(function (event) {
	});

	var callback_ui_canvas_touch_cancel = _callback_ui_canvas_touch_shim(function (event) {
	});

	var callback_ui_canvas_touch_leave = _callback_ui_canvas_touch_shim(function (event) {
	});

	var callback_ui_redraw = function () {
		spz.client.ui.canvas_ctx.drawImage(spz.client.ui.root.buffer_get(), 0, 0);
	};

	var callback_document_ready = function () {
		// remove scrollbars
		$('body').css({'overflow': 'hidden'});
		
		// link to canvas
		var $canvas = $('div#canvas canvas#client_ui');
		var canvas = spz.client.ui.canvas = $canvas.get(0);
		var canvas_ctx = spz.client.ui.canvas_ctx = canvas.getContext('2d');

		// create views recursively
		spz.client.ui.root = new spz.client.views.root();

		// register resize callback
		$(window).resize(callback_ui_window_resize);
		
		// draw views
		callback_ui_window_resize();

		// register canvas callback
		if (!window.supports_touch_events) {
			$canvas.on('mousemove', callback_ui_canvas_mouse_move);
			$canvas.on('mousedown', callback_ui_canvas_mouse_down);
			$canvas.on('mouseup', callback_ui_canvas_mouse_up);
			$canvas.on('mouseleave', callback_ui_canvas_mouse_leave);
		}
		else {
			$canvas.on('touchstart', callback_ui_canvas_touch_start);
			$canvas.on('touchmove', callback_ui_canvas_touch_move);
			$canvas.on('touchend', callback_ui_canvas_touch_end);
			$canvas.on('touchcancel', callback_ui_canvas_touch_cancel);
			$canvas.on('touchleave', callback_ui_canvas_touch_leave);
		}
	};

	// register document ready callback
	$(document).ready(callback_document_ready);

})(window.spz, window.jQuery);
