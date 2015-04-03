(function (spz, ctor) {
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

		prototype.set = function (x, y, width, height) {
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
		};

		prototype.contains = function (x, y) {
			return (this.x <= x && x < this.x + this.width) && (this.y <= y && y < this.y + this.height);
		};

		prototype.with_border = function (border_rel) {
			var border = Math.floor(this.width * border_rel);
			return new spz.client.objects.bb_abs(
				this.x + border,
				this.y + border,
				this.width - (border * 2.0),
				this.height - (border * 2.0)
			);
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

		prototype.inverse = function () {
			return new spz.client.objects.bb_rel(
				1.0 - this.x,
				1.0 - this.y,
				1.0 - this.width,
				1.0 - this.height
			);
		};

		prototype.to_abs = function (bb_abs, truncate) {
			truncate = truncate || true;
			if (truncate) {
				return new spz.client.objects.bb_abs(
					Math.floor(this.x * bb_abs.width),
					Math.floor(this.y * bb_abs.height),
					Math.floor(this.width * bb_abs.width),
					Math.floor(this.height * bb_abs.height)
				);
			}
			else {
				return new spz.client.objects.bb_abs(
					Math.ceil(this.x * bb_abs.width),
					Math.ceil(this.y * bb_abs.height),
					Math.ceil(this.width * bb_abs.width),
					Math.ceil(this.height * bb_abs.height)
				);
			}
		};
	});
})(window.spz, window.mozart);
