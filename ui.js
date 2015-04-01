(function (spz, fabric) {
	spz.client.views = spz.client.views || {};
	
	spz.client.views.nav_button = fabric.util.createClass(fabric.Rect, {
		type: 'spz_nav_button',
		
		initialize: function (options) {
			options = options || {};
			
			this.callSuper('initialize', options);
			this.set('label', options.label || '');
		},
		
		toObject: function () {
			return fabric.util.object.extend(this.callSuper('toObject'), {
				label: this.get('label')
			});
		},
		
		_render: function(ctx) {
			this.callSuper('_render', ctx);
			
			ctx.font = '20px Helvetica';
			ctx.fillStyle = '#333';
			ctx.fillText(this.label, -this.width/2, -this.height/2 + 20);
		}
	});
})(window.spz, window.fabric);

		/*
		window.client_options.ui = {}
		window.client_options.ui.key_spacing = 0.02;
		window.client_options.ui.key_white_color = 'rgb(255, 255, 255)';
		window.client_options.ui.key_white_down_color = 'rgb(10, 46, 166)';
		window.client_options.ui.key_white_outline = 'rgb(50, 50, 50)';
		window.client_options.ui.key_black_color = 'rgb(0, 0, 0)';
		window.client_options.ui.key_black_down_color = 'rgb(245, 209, 89)';
		window.client_options.ui.key_black_outline = 'rgb(50, 50, 50)';
		*/