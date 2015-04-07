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
	spz.client.ui.view_current = spz.defines.views_available.keyboard;

	spz.client.ui.orientation = spz.defines.orientation.landscape;


	/*
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
		spz.client.ui.canvas.width = spz.client.ui.width = browser_viewport_width;
		spz.client.ui.canvas.height = spz.client.ui.height = browser_viewport_height;
		spz.client.ui.orientation = spz.helpers.ui.orientation_get(browser_viewport_width, browser_viewport_height);
		spz.client.ui.root.bb_set(new spz.client.objects.bb_abs(0, 0, browser_viewport_width, browser_viewport_height));
		callback_ui_redraw();
	};

	var _callback_ui_canvas_mouse_wrapper = function (callback) {
		return function(event) {
			event.changedTouches = [];
			event.changedTouches.push({
				clientX: event.clientX || -1,
				clientY: event.clientY || -1,
				identifier: spz.defines.touch_id_mouse
			});
			return callback(event);
		};
	};

	var callback_ui_canvas_mouse_move = _callback_ui_canvas_mouse_wrapper(function (event) {
		spz.client.ui.root.event_occurred('touch_move', event);
		callback_ui_redraw();
	});

	var callback_ui_canvas_mouse_down = _callback_ui_canvas_mouse_wrapper(function (event) {
		spz.client.ui.root.event_occurred('touch_start', event);
		callback_ui_redraw();
	});
	
	var callback_ui_canvas_mouse_up = _callback_ui_canvas_mouse_wrapper(function (event) {
		spz.client.ui.root.event_occurred('touch_end', event);
		callback_ui_redraw();
	});
	
	var callback_ui_canvas_mouse_leave = _callback_ui_canvas_mouse_wrapper(function (event) {
		spz.client.ui.root.event_occurred('touch_leave', event);
		callback_ui_redraw();
	});
	
	var _callback_ui_canvas_touch_shim = function (callback) {
		return function(event) {
			if (!('changedTouches' in event)) {
				event = event.originalEvent;
			}
			return callback(event);
		};
	};

	var callback_ui_canvas_touch_start = _callback_ui_canvas_touch_shim(function (event) {
		spz.client.ui.root.event_occurred('touch_start', event);
		callback_ui_redraw();
	});

	var callback_ui_canvas_touch_move = _callback_ui_canvas_touch_shim(function (event) {
		spz.client.ui.root.event_occurred('touch_move', event);
		callback_ui_redraw();
	});

	var callback_ui_canvas_touch_end = _callback_ui_canvas_touch_shim(function (event) {
		spz.client.ui.root.event_occurred('touch_end', event);
		callback_ui_redraw();
	});

	var callback_ui_canvas_touch_cancel = _callback_ui_canvas_touch_shim(function (event) {
		spz.client.ui.root.event_occurred('touch_cancel', event);
		callback_ui_redraw();
	});

	var callback_ui_canvas_touch_leave = _callback_ui_canvas_touch_shim(function (event) {
		spz.client.ui.root.event_occurred('touch_leave', event);
		callback_ui_redraw();
	});

	var callback_ui_redraw = function () {
		if (spz.client.ui.root.redraw_necessary) {
			spz.client.ui.root.redraw(spz.client.ui.canvas_ctx);
		}
	};

	var callback_document_ready = function () {
		// load SVG resources
		for (var view_name in spz.defines.views_enabled) {
			var view_id = spz.defines.views_enabled[view_name];
			// hack for some weird Chrome closure bug...
			var callback_done_generator = function (_view_id) {
				return function (data) {
					spz.client.resources.view_icons[_view_id].data = data;
					callback_ui_redraw();
				};
			}
			$.ajax({
				url: spz.client.resources.view_icons[view_id].url
			}).done(callback_done_generator(view_id));
		}

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
