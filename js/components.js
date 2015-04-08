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