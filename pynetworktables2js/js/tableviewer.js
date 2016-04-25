"use strict";

(function() {

	if ($ === undefined) {
	    alert("jQuery must be downloaded+included to use tableviewer.js!");
	    return;
	}

	function Tableviewer($el) {
		this.$el = $el.addClass('tableviewer');
		this.ntRoot = {
			'' : {
				type : 'table',
				$el : $('<ul>Root</ul>').appendTo($el)
			}
		};

		// Expand/Collabse tables
		$el.on('click', '.expanded, .collapsed', function(e) {
			$(this).toggleClass('expanded collapsed');
		});

		// Resize number input based on length of input
		$el.on('change keyup ntUpdate', '[type=number]', function(e) {
			var text = $(this).val();
			var length = text.length;
			var $phantomInput = $(this).next();
			$phantomInput.text(text);
			$(this).css('max-width', 13 + $phantomInput.width());
		});

		$el.on('change keyup ntUpdate', '[type=text]', function(e) {
			var text = $(this).val();
			var length = text.length;
			var $phantomInput = $(this).next();
			$phantomInput.text(text);
			//$(this).attr('size', length);
			$(this).css('max-width', 10 + $phantomInput.width());
		});

		// Update NetworkTables
		$el.on('change', '[type=checkbox]', function(e) {
			var key = $(this).parents('[data-path]').data('path');
			var value = $(this).prop('checked');
			NetworkTables.putValue(key, value);
		});

		$el.on('change', '[type=text]', function(e) {
			var key = $(this).parents('[data-path]').data('path');
			var value = $(this).val();
			NetworkTables.putValue(key, value);
		});

		$el.on('change', '[type=number]', function(e) {
			var key = $(this).parents('[data-path]').data('path');
			var value = parseFloat($(this).val());
			NetworkTables.putValue(key, parseFloat(value));
		});


		var that = this;
		NetworkTables.addGlobalListener(function(key, value, isNew) {
			that._putValue(key, value, 0);
		}, true);
	}

	Tableviewer.prototype.printTable = function() {
		console.log(this.ntRoot);
	};

	Tableviewer.prototype._putValue = function(key, value) {
		var steps = key.split('/').filter(function(s) { return s.length > 0; });

		var parentPath = '';

		for(var i = 0 ; i < steps.length - 1; i++) {
			if(!this._createTableNode(parentPath, steps[i])) {
				return;
			}
			parentPath += '/' + steps[i];
		}

		var type = typeof(value);
		var step = steps[steps.length - 1];
		var path = parentPath + '/' + step;

		// Create node if it doesn't exist
		if(!this.ntRoot[path]) {
			if(type === 'object') {
				this._createArrayNode(parentPath, step, value);
			} else if(type === 'boolean') {
				this._createBooleanNode(parentPath, step, value);
			} else if(type === 'number') {
				this._createNumberNode(parentPath, step, value);
			} else {
				this._createStringNode(parentPath, step, value);
			}
		}

		// Update the value				
		if(type === 'object') {
			this._updateArray(path, value);
		} else if(type === 'boolean') {
			this._updateBoolean(path, value);	
		} else if(type === 'number') {
			this._updateNumber(path, value);	
		} else {
			this._updateString(path, value);	
		}
	};

	Tableviewer.prototype._updateArray = function(path, values) {
		// this.ntRoot[pathTraveled].$type.text(value.type + '[' + value.length + ']');
		var type = 'array';

		for(var i = 0; i < values.length; i++) {
			var value = values[i];
			type = typeof(value);

			// Create array elements
			if(!this.ntRoot[path + '/' + i]) {
				if(type === 'boolean') {
					this._createBooleanNode(path, i, value);
				} else if(type === 'number') {
					this._createNumberNode(path, i, value);
				} else {
					this._createStringNode(path, i, value);
				}

				// Disable the input
				this.ntRoot[path + '/' + i].$value.prop('disabled', true);
			}

			// Update the value
			if(type === 'boolean') {
				this._updateBoolean(path + '/' + i, value);
			} else if(type === 'number') {
				this._updateNumber(path + '/' + i, value);
			} else {
				this._updateString(path + '/' + i, value);
			}

		}

		// Remove array elements
		var $items = this.ntRoot[path].$el.find('li');
		for(var i = values.length; i < $items.length; i++) {
			delete this.ntRoot[path + '/' + i];
			$items[i].remove();
		}

		// Set the type label
		this.ntRoot[path].$type.text(type + '[' + values.length + ']');
	};

	Tableviewer.prototype._updateBoolean = function(path, value) {
		this.ntRoot[path].$value.prop('checked', value);
	};

	Tableviewer.prototype._updateNumber = function(path, value) {
		this.ntRoot[path].$value.val(value);
		this.ntRoot[path].$value.trigger('ntUpdate');
	};

	Tableviewer.prototype._updateString = function(path, value) {
		this.ntRoot[path].$value.val(value);
		this.ntRoot[path].$value.trigger('ntUpdate');
	};

	Tableviewer.prototype._createTableNode = function(parentPath, step) {

		var path = parentPath + '/' + step;

		// If path exists and is not a table then it's a value. The value being added/updated is invalid
		if(this.ntRoot[path] && this.ntRoot[path].type !== 'table') {
			return false;
		}

		if(!this.ntRoot[path]) {
			// Otherwise the path doesn't exist so add
			var $el = $('<li class="table"><button class="expanded"></button>' + step + '<ul></ul></li>')
				.appendTo(this.ntRoot[parentPath].$el);
			
			this.ntRoot[path] = {
				type : 'table',
				$el : $el.find('ul'),
			}
		}

		return true;
	};

	Tableviewer.prototype._createArrayNode = function(parentPath, step, value) {
		var path = parentPath + '/' + step;
		//var typeLabel = value.type + '[' + value.length + ']';
		var $el = $('<li class="array" data-path="' + path + '">' +
						'<button class="expanded"></button>' + 
						step + 
						'<span class="type">Array[' + value.length + ']</span>' +
						'<ul></ul>' +
					'</li>')
			.appendTo(this.ntRoot[parentPath].$el);

		this.ntRoot[path] = {
			type : 'array',
			$el : $el.find('ul'),
			$type : $el.find('.type')
		};
	};

	Tableviewer.prototype._createBooleanNode = function(parentPath, step, value) {
		var path = parentPath + '/' + step;
		var $el = $('<li class="boolean" data-path="' + path + '"></li>')
			.append('<span class="key">' + step + '</span>')
			.append('<input type="checkbox" class="value"/>')
			.append('<span class="type">boolean</span>')
			.appendTo(this.ntRoot[parentPath].$el);

		this.ntRoot[path] = {
			type : 'boolean',
			$el : $el,
			$key : $el.find('.key'),
			$value : $el.find('.value'),
			$type : $el.find('.type')
		};
	};

	Tableviewer.prototype._createNumberNode = function(parentPath, step, value) {
		var path = parentPath + '/' + step;
		var $el = $('<li class="number" data-path="' + path + '"></li>')
			.append('<span class="key">' + step + '</span>')
			.append('<input type="number" step="any" class="value"/>')
			.append('<span class="phantom-input"></span>')
			.append('<span class="type">number</span>')
			.appendTo(this.ntRoot[parentPath].$el);

		this.ntRoot[path] = {
			type : 'number',
			$el : $el,
			$key : $el.find('.key'),
			$value : $el.find('.value'),
			$phantomInput : $el.find('.phantom-input'),
			$type : $el.find('.type')
		};
	};

	Tableviewer.prototype._createStringNode = function(parentPath, step, value) {
		var path = parentPath + '/' + step;
		var $el = $('<li class="string" data-path="' + path + '"></li>')
			.append('<span class="key">' + step + '</span>')
			.append('&ldquo;<input type="text" class="value"/>&rdquo;')
			.append('<span class="phantom-input"></span>')
			.append('<span class="type">string</span>')
			.appendTo(this.ntRoot[parentPath].$el);

		this.ntRoot[path] = {
			type : 'string',
			$el : $el,
			$key : $el.find('.key'),
			$value : $el.find('.value'),
			$phantomInput : $el.find('.phantom-input'),
			$type : $el.find('.type')
		};
	};


	// jQuery plugin
	$.fn.extend({
		tableviewer:  function() {
			var args = [...arguments];
			var method = args.shift();
			var methodArgs = args;

			return this.each(function() {
				var $el = $(this);
				var tableviewer = $el.data('tableviewer');
				
				// Initialize tableviewer
				if(typeof(tableviewer) === 'undefined') {
					$el.data('tableviewer', new Tableviewer($el));
				// Call tableviewer method
				} else {
					Tableviewer.prototype[method].apply(tableviewer, methodArgs);
				}
			});
		}
	});

})();