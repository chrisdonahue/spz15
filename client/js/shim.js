(function () {
	window.supports_websocket = 'WebSocket' in window || 'MozWebSocket' in window;
	window.supports_canvas = (function() {
		var elem = document.createElement('canvas');
		return !!(elem.getContext && elem.getContext('2d'));
	})();
	window.supports_touch_events = 'ontouchstart' in window || 'onmsgesturechange' in window;

	if (window.supports_canvas) {
		CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
		  if (w < 2 * r) r = w / 2;
		  if (h < 2 * r) r = h / 2;
		  this.beginPath();
		  this.moveTo(x+r, y);
		  this.arcTo(x+w, y,   x+w, y+h, r);
		  this.arcTo(x+w, y+h, x,   y+h, r);
		  this.arcTo(x,   y+h, x,   y,   r);
		  this.arcTo(x,   y,   x+w, y,   r);
		  this.closePath();
		  return this;
		}
	}
})();
