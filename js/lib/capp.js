window.capp = window.capp || {};

(function (capp, _) {
	var capp_base = function () {};

	/*
		extend shim
	*/

	// stolen from backbone.js who stole it from goog.inherits
	var extend = capp_base.extend = function(protoProps, staticProps) {
		var parent = this;
		var child;

		// The constructor function for the new subclass is either defined by you
		// (the "constructor" property in your `extend` definition), or defaulted
		// by us to simply call the parent's constructor.
		if (protoProps && _.has(protoProps, 'constructor')) {
			child = protoProps.constructor;
		} else {
			child = function(){ return parent.apply(this, arguments); };
		}

		// Add static properties to the constructor function, if supplied.
		_.extend(child, parent, staticProps);

		// Set the prototype chain to inherit from `parent`, without calling
		// `parent`'s constructor function.
		var Surrogate = function(){ this.constructor = child; };
		Surrogate.prototype = parent.prototype;
		child.prototype = new Surrogate;

		// Add prototype properties (instance properties) to the subclass,
		// if supplied.
		if (protoProps) _.extend(child.prototype, protoProps);

		// Set a convenience property in case the parent's prototype is needed
		// later.
		child.__super__ = parent.prototype;

		return child;
	};

	/*
		point
	*/

	var capp_point = capp.point = capp_base.extend({
		constructor: function (x, y) {
			this.x = x || 0;
			this.y = y || 0;
		}
	});

	/*
		bb_base
	*/

	var capp_bb_base = capp_base.extend({
		constructor: function (x, y, width, height) {
			this.x = x || 0;
			this.y = y || 0;
			this.width = width || 0;
			this.height = height || 0;
		}
	});

	/*
		bb_abs
		extends bb_base
	*/

	var capp_bb_abs = capp.bb_abs = capp_bb_base.extend({
		contains: function (x, y) {
			return (this.x <= x && x < this.x + this.width) && (this.y <= y && y < this.y + this.height);
		},
		with_border: function (border_x_rel, border_y_rel) {
			var border_x = Math.floor(this.width * border_x_rel);
			var border_y = Math.floor(this.height * border_y_rel);
			var border = Math.min(border_x, border_y);
			return new capp_bb_abs(
				this.x + border,
				this.y + border,
				this.width - (border * 2.0),
				this.height - (border * 2.0)
			);
		}
	});

	/*
		bb_rel
		extends bb_base
	*/

	var capp_bb_rel = capp.bb_rel = capp_bb_base.extend({
		inverse: function () {
			return new capp_bb_rel(
				1.0 - this.x,
				1.0 - this.y,
				1.0 - this.width,
				1.0 - this.height
			);
		},
		to_abs: function (bb_abs_instance, truncate) {
			truncate = truncate || true;
			if (truncate) {
				return new capp_bb_abs(
					Math.floor((this.x * bb_abs_instance.width) + bb_abs_instance.x),
					Math.floor((this.y * bb_abs_instance.height) + bb_abs_instance.y),
					Math.floor(this.width * bb_abs_instance.width),
					Math.floor(this.height * bb_abs_instance.height)
				);
			}
			else {
				return new capp_bb_abs(
					Math.ceil((this.x * bb_abs_instance.width) + bb_abs_instance.x),
					Math.ceil((this.y * bb_abs_instance.height) + bb_abs_instance.y),
					Math.ceil(this.width * bb_abs_instance.width),
					Math.ceil(this.height * bb_abs_instance.height)
				);
			}
		}
	});

	/*
		capp_canvas
	*/

	var window_supports_touch_events = 'ontouchstart' in window || 'onmsgesturechange' in window;

	var capp_canvas = capp.canvas = capp_base.extend({
		constructor: function (canvas_id) {
			var canvas = this.__canvas = document.getElementById(canvas_id);
			var canvas_ctx = this.__canvas_ctx = canvas.getContext('2d');

			// event handling
			var that = this;
			if (window_supports_touch_events) {
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

				canvas.ontouchstart = event_touch_shim(this.__event_callback('touch_start'));
				canvas.ontouchmove = event_touch_shim(this.__event_callback('touch_move'));
				canvas.ontouchend = event_touch_shim(this.__event_callback('touch_end'));
				canvas.ontouchleave = event_touch_shim(this.__event_callback('touch_leave'));
				canvas.ontouchcancel = event_touch_shim(this.__event_callback('touch_cancel'));
			}
			else {
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

				canvas.onmousedown = event_mouse_to_touch_shim(this.__event_callback('touch_start'));
				canvas.onmousemove = event_mouse_to_touch_shim(this.__event_callback('touch_move'));
				canvas.onmouseup = event_mouse_to_touch_shim(this.__event_callback('touch_end'));
				canvas.onmouseleave = event_mouse_to_touch_shim(this.__event_callback('touch_leave'));
			}

			this.__component_root = null;
			this.__component_root_bb = new capp.bb_abs();
		},

		component_root_set: function (component_root) {
			this.__component_root = component_root;
			component_root.bb_set(this.__component_root_bb);
		},

		__event_callback: function (event_type) {
			var that = this;
			return function( event) {
				var component_root = that.__component_root;
				if (component_root !== null) {
					component_root.event_callback_get__(event_type)(event);
				}
			};
		},

		resize: function (width, height) {
			// change canvas width
			var canvas = this.__canvas;
			canvas.width = width;
			canvas.height = height;

			// change root bounding box width
			var component_root_bb = this.__component_root_bb;
			component_root_bb.width = width;
			component_root_bb.height = height;

			// change root width
			var component_root = this.__component_root;
			if (component_root !== null) {
				component_root.bb_set(component_root_bb);
			}
		},

		redraw: function (force) {
			force = force || false;
			var component_root = this.__component_root;
			if (component_root !== null) {
				component_root.redraw__(this.__canvas_ctx, force);
			}
		}
	});

	/*
		capp_component
	*/

	var capp_component = capp.component = capp_base.extend({
		constructor: function () {
			this._bb = new capp.bb_abs();
			this._dirty = false;
			this.__subcomponents = {};
			this.__subcomponents_count = 0;
			this.__event_callbacks = {};
			this.__visible = false;
		},

		_subcomponent_add__: function (subcomponent_id, subcomponent) {
			this.__subcomponents[subcomponent_id] = subcomponent;
			this.__subcomponents_count++;
		},

		_subcomponent_get__: function (subcomponent_id) {
			return this.__subcomponents[subcomponent_id];
		},

		_subcomponent_remove__: function (subcomponent_id) {
			delete this.__subcomponents[subcomponent_id];
			this.__subcomponents_count--;
		},

		_subcomponents_count__: function () {
			return this.__subcomponents_count;
		},

		bb_get__: function () {
			return this._bb;
		},

		bb_set: function (bb) {
			this._bb = bb || new capp.bb_abs();
			this._dirty = true;
		},

		contains__: function (x, y) {
			return this._bb.contains(x, y);
		},

		event_on__: function (event_type, callback) {
			this.__event_callbacks[event_type] = callback;
		},

		event_off__: function (event_type) {
			delete this.__event_callbacks[event_type];
		},

		event_callback_get__: function (event_type) {
			var subcomponents = this.__subcomponents;
			var callbacks = this.__event_callbacks;
			return function (event) {
				for (var subcomponent_id in subcomponents) {
					var subcomponent = subcomponents[subcomponent_id];
					var touch_event = event.changedTouches[0];
					if (subcomponent.contains__(touch_event.clientX, touch_event.clientY)) {
						subcomponent.event_callback_get__(event_type)(event);
					}
				}
				if (!event.consumed && event_type in callbacks) {
					callbacks[event_type](event);
				}
			}
		},

		visible_get__: function () {
			return this.__visible;
		},

		visible_set__: function (_visible) {
			this.__visible = _visible;
		},

		redraw__: function (canvas_ctx, force) {
			force = force || false;

			if (force) {
				// redraw
				this._redraw.call(this, canvas_ctx);

				// mark as clean
				this._dirty = false;

				for (subcomponent_id in this.__subcomponents) {
					var subcomponent = this.__subcomponents[subcomponent_id];
					subcomponent.redraw__(canvas_ctx, true);
				}
			}
			else {
				if (this._dirty) {
					// redraw
					this._redraw.call(this, canvas_ctx);

					// mark as clean
					this._dirty = false;

					// force all children to redraw
					for (subcomponent_id in this.__subcomponents) {
						var subcomponent = this.__subcomponents[subcomponent_id];
						subcomponent.redraw__(canvas_ctx, true);
					}
				}
				else {
					// redraw all children
					for (subcomponent_id in this.__subcomponents) {
						var subcomponent = this.__subcomponents[subcomponent_id];
						subcomponent.redraw__(canvas_ctx, false);
					}
				}
			}
		},

		_redraw: function (canvas_ctx) {}
	});

})(window.capp, window._);
