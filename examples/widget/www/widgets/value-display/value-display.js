"use strict";

dashboardWidget.addType({
	
	name: 'ValueDisplay',
	view: '/widgets/value-display/value-display.html',
	
	initWidget: function() {
		this.keyElement = this.element.find('.key').text(this.options.ntKey);
		this.valueElement = this.element.find('.value');
	},
	
	updateWidget: function(value, isNew) {
		this.valueElement.text(value);
	}
	
});