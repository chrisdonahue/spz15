(function (spz) {
	spz.client.objects = spz.client.objects || {};

	spz.client.objects.point = ctor(function(prototype, _, _protected, __, __private) {
		// public
		prototype.init = function (x, y) {
			this.x = x;
			this.y = y;
		};
	});

	spz.client.objects.bb_abs = ctor(function(prototype, _, _protected, __, __private) {
		// public
		prototype.init = function (x, y, width, height) {
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
		};

		prototype.intersects = function (point) {
			return (this.x <= point.x && point.x < this.x + this.width) && (this.y <= point.y && point.y < this.y + this.height);
		};
	});

	spz.client.objects.bb_rel = ctor(function(prototype, _, _protected, __, __private) {
		// public
		prototype.init = function (x, y, width, height) {
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
		};

		prototype.to_abs = function (bb_abs, truncate) {
			truncate = truncate || true;
			if (truncate) {
				return new spz.client.objects.bb_abs(
					Math.floor(this.x * bb_abs.x),
					Math.floor(this.y * bb_abs.y),
					Math.floor(this.width * bb_abs.width),
					Math.floor(this.height * bb_abs.height)
				);
			}
			else {
				return new spz.client.objects.bb_abs(
					Math.ceil(this.x * bb_abs.x),
					Math.ceil(this.y * bb_abs.y),
					Math.ceil(this.width * bb_abs.width),
					Math.ceil(this.height * bb_abs.height)
				);
			}
		};
	});
})(window.spz);
