"use strict";

var dashboardWidget = new function() {
	
	this.addType = function(settings) {
		
		settings = $.extend(true, {
			
			// The name of the jquery widget prefixed with nt
			name: 'DashboardWidget',	
			// Default options for the widget
			options: {
				ntKey: null,
				ntDefaultValue: null
			},
			// If a url to an html page is given then its content is appended to the element
			view: null,
			// Called when the the widget is created
			initWidget: function() {},
			// Called when the value associated with the network tables key is updated
			updateWidget: function(value, isNew) {},
			// The _create function called by the widget factory on initialization
		    _create: function() {
		    	
	    		var widget = this;
		    	
		    	// Adds a key listener
	    		console.log(this.options.ntKey);

		    	// Gets content from the view if one was provided
		    	var view = this.view;
		    	
		    	if(view) {
		    		
		    		$.ajax({
	    			   type: 'GET',
	    			   url: view,
	    			   dataType: 'html',
	    			   success: function(content) {
	    				   widget.element.append(content);
	    			   },
	    			   complete: function() {
	    				   widget.initWidget();	
	    				   NetworkTables.addKeyListener(widget.options.ntKey, function(key, value, isNew) {
	    					   widget.updateWidget(value, isNew);
	    			       }, true);
	    			    	
	    			   }
	    			});
		    	
		    	} else {
		    		this.initWidget();
			    	NetworkTables.addKeyListener(widget.options.ntKey, function(key, value, isNew) {
			    		widget.updateWidget(value, isNew);
			    	}, true);
			    	
		    	}
		    },
		    
		    
		    // Used by the widget factory to define behavior when options are set. Override
		    // to define behavior for your own custom dashboard widget. 
		    _setOption: function( key, value ) {
		        //this.options[ key ] = value;
		    },
			
			
		    // Sets a value in the NetworkTables using the key provided by the widget
			putValue : function(value) {	
		    	var key = this.options.ntKey;
		    	NetworkTables.putValue(key, value);    	  	
			},
			
			// Returns the value the key provided by the widget maps to. If the key isn't present
			// then the default value provided by the widget is returned instead.
			getValue: function() {
				return NetworkTables.getValue(this.options.ntKey, this.options.ntDefaultValue);
			}
		}, settings);
	
		$.widget("pynetworktables2js.nt" + settings.name, settings);
		
	};
	
};
