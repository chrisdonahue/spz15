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
		set up namespaces and parse options
	*/

	// namespaces
	spz.client = spz.client || {};
	spz.client.control = spz.client.control || {};
	spz.client.ui = spz.client.ui || {};
	
	// control
	$.extend(spz.client.control, spz.client.options.control);

	// ui
	$.extend(spz.client.ui, spz.client.options.ui);
	spz.client.ui.orientation = spz.defines.orientation.landscape;

	/*
		window resize callback
	*/

	// ui callbacks
	var callback_ui_window_resize = function () {
		var browser_viewport_width = $(window).width();
		var browser_viewport_height = $(window).height();
		spz.client.ui.orientation = spz.helpers.ui.orientation_get(browser_viewport_width, browser_viewport_height);
		spz.client.app.resize(browser_viewport_width, browser_viewport_height);
		spz.client.app.redraw();
	};

	/*
		ui init
	*/

	var callback_document_ready = function () {
		// create canvas app
		var app = spz.client.app = new capp.canvas('spz_app_canvas');

		// create root component
		app.component_root_set(new spz.client.views.root());

		// load SVG resources
		var DOMURL = window.URL || window.webkitURL || window;
		for (var i = 0; i < spz.client.ui.views_enabled.length; i++) {
			var view_id = spz.client.ui.views_enabled[i];
			// hack for some weird Chrome closure bug...
			var callback_done_generator = function (_view_id) {
				return function (data) {
					//spz.client.resources.view_icons[_view_id].data = data;
					var image = new Image();
					var svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
					var url = DOMURL.createObjectURL(svg);
					image.onload = function () {
						spz.client.app.redraw(true);
					};
					spz.client.resources.view_icons[_view_id].image = image;
					image.src = url;
				};
			}
			$.ajax({
				url: spz.client.resources.view_icons[view_id].url,
				type: 'GET',
				dataType: 'text'
			}).done(callback_done_generator(view_id));
		}

		// remove scrollbars
		$('body').css({'overflow': 'hidden'});

		// register resize callback
		$(window).resize(callback_ui_window_resize);
		
		// draw views
		callback_ui_window_resize();
	};

	// register document ready callback
	$(document).ready(callback_document_ready);

})(window.spz, window.jQuery);
