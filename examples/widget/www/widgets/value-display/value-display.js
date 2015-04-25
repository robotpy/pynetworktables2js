$.pynetworktables2js.dashboardWidget.types['valueDisplay'] = {
		
	init : function(widget) {
		widget.keyElement = widget.element.find('.key')
			.text(widget.options.networkTables.key);
		widget.valueElement = widget.element.find('.value');
	},
	
	updateWidget : function(value, isNew, widget) {
		widget.valueElement.text(value);
	},
	
	url : '/widgets/value-display/value-display.html'
};