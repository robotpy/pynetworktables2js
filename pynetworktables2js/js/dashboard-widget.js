"use strict";

(function() {
	
	var nextID = 1;
	
	// Maintains a list of all the widgets
	var registeredWidgets = {};

	$.widget( "pynetworktables2js.dashboardWidget", {
		
		_id : null,
		
		options : {
			
		   /** Sets this widget's default options to an existing type if provided */
			type : null,
			
		   /**
			*  Key is a NetworkTables key that the value sent/received will map to. 
			*  If fromRobot is true then the value will be received from the robot. 
			*  If fromRobot is false then the value will be sent to the robot.
			*  If there is no value that maps to the given key, a defaultValue is
			*  passed instead.
			*/ 	
			networkTables : {
				key : null,
				fromRobot : true,
				defaultValue : null
			},
			
		   /** 
			*  The url of the file that contains the HTML content that will be appended
			*  to the widget before init is called
			*/
			url : null,
			
		   /** Called when the widget is created. */
			init : function(widget) {},
			
		   /**
			*  Called when the NetworkTables value is updated by the robot. 
			*  Only called when networkTables.fromRobot is true.
			* 
			*  @param value: The updated value
			*  @param isNew: True if this is the first time the key has been set
			*  @param widget: The parent widget object
			*/ 
			updateWidget : function(value, isNew, widget) {},
			
		   /** 
			*  Called when the NetworkTables value needs to be updated. The new
			*  value can be retrieved from the robot.
			*  
			*  @param widget: The parent widget object
			*  
			*  @return: The updated value that's put into the NetworkTable
			*/
			updateRobot : function(widget) {}
			
		},
		 
	    _create : function() {
	    	
	    	this._id = nextID++;
	    	
	    	// Sets the type of the widget if one was provided
	    	var type = $.pynetworktables2js.dashboardWidget.types[this.options.type];
	    	
	    	if(type) {
	    		$.extend(true, this.options, type);
	    	}
	    	
	    	// Add slash to front and remove slash from end
	    	var key = this.options.networkTables.key;
	    	if(key) {
	    		
	    		if(key[0] !== '/')
	    			key = '/' + key;
	    		
	    		if(key[ key.length - 1] === '/')
	    			key = key.substring(0, key.length - 1);
	    				
	    	}
	    	
	    	// Gets content from the url if one was provided
	    	var url = this.options.url;
	    	
	    	if(url) {
	    		
	    		var widget = this;
	    		
	    		$.ajax({
    			   type: 'GET',
    			   url: url,
    			   dataType: 'html',
    			   success: function(content) {
    				   widget.element.append(content);
    			   },
    			   complete: function() {
    				   
    				   var options = widget.options;
    				   
    				   options.init(widget);
    				   registeredWidgets[widget._id] = widget;
    				   
    				   if(options.networkTables.fromRobot) {
    					   var value = NetworkTables.getValue(options.networkTables.key, options.networkTables.defaultValue);
    					   options.updateWidget(value, false, widget);
    				   }
    				   
    			   }
    			});
	    	
	    	} else {
	    		var options = this.options;
	    		options.init(this);
				registeredWidgets[this._id] = this;
				
				if(options.networkTables.fromRobot) {
					var value = NetworkTables.getValue(options.networkTables.key, options.networkTables.defaultValue);
					options.updateWidget(value, false, this);
				}
	    	}
	    },
	    
	   /**
	    * When the widget is removed from the DOM remove from registered widgets as well
	    */
	    _destroy : function() {
	    	delete registeredWidgets[this._id];
	    },
	    
	   /**
	    * Sets options
	    */
	    _setOption : function( key, value ) {
	        this.options[ key ] = value;
	    },
		
		
	   /**
	    *  Calling this updates the the NetworkTables. Should only be called if the
	    *  NetworkTables.fromRobot option is false.
	    */
		update : function() {
			
	    	var networkTablesOptions = this.options.NetworkTables;
	    	    	
	    	if(networkTablesOptions.fromRobot || !networkTablesOptions.key)
	    		return;
	    	
	    	NetworkTables.putValue(networkTablesOptions.key, this.options.updateRobot(this));
	    	  	
		}
	 
	});
	
	
	// Notify widgets of incoming NetworkTables values
	NetworkTables.addGlobalListener(function(key, value, is_new) {
		
		for(var id in registeredWidgets) {
			var widget = registeredWidgets[id];
			var fromRobot = widget.options.networkTables.fromRobot;
			
			if(fromRobot) {
				var widgetKey = widget.options.networkTables.key;
				
				if(widgetKey === key)
					widget.options.updateWidget(value, is_new, widget);
			}

		}
	});
	
	// Contains a list of all the types of dashboard widgets that can be created
	$.pynetworktables2js.dashboardWidget.types = {};
	

})();
