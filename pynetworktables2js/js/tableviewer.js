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

		this._createModal();

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
			NetworkTables.putValue(key, value);
		});

		var that = this;

		// Show context menu for inserting values
		this._createContextMenu();



		NetworkTables.addGlobalListener(function(key, value, isNew) {
			that._putValue(key, value, 0);
		}, true);
	}

	Tableviewer.prototype._createContextMenu = function() {
		var $contextMenu = $('<div class="contextmenu" style="display: none">' +
								'<span class="add-string">Add String</span>' + 
								'<span class="add-number">Add Number</span>' + 
								'<span class="add-boolean">Add Boolean</span>' + 
							'</div>').appendTo(this.$el);

		this.contextMenu = {
			$el : $contextMenu,
			$addString : $contextMenu.find('.add-string'),
			$addNumber : $contextMenu.find('.add-number'),
			$addBoolean : $contextMenu.find('.add-boolean')
		};

		var that = this;

		var key = '';

		this.$el.on('contextmenu', 'li.table, li.table > *', function(e) {
			var $target = $(e.target);
			var $table = $target.hasClass('table') ? $target : $target.parent();
			if($table.hasClass('table')) {
				e.preventDefault();
				key = $table.attr('data-path');
				that._openContextMenu(e.pageX - that.$el.offset().left, e.pageY - that.$el.offset().top);
			} else {
				that._closeContextMenu();
			}
		});

		this.contextMenu.$addString.on('click', function(e) {
			that._showModal(key + '/', 'string');
		});

		this.contextMenu.$addNumber.on('click', function(e) {
			that._showModal(key + '/', 'number');
		});

		this.contextMenu.$addBoolean.on('click', function(e) {
			that._showModal(key + '/', 'boolean');
		});

		this.$el.on('click', function(e) {
			that._closeContextMenu();
		});
	};

	Tableviewer.prototype._openContextMenu = function(x, y) {
		this.contextMenu.$el.css({
			'display' : 'block',
			'left' : x,
			'top' : y
		});

	};

	Tableviewer.prototype._closeContextMenu = function() {
		this.contextMenu.$el.css('display', 'none');
	};


	Tableviewer.prototype._createModal = function() {

		var $modal = $('<div class="tableviewer-modal" style="display: none">' +
							'<div class="close">&times;</div>' +
							'<div class="title">Put <span class="type-label">Value</span></div>' +
							'<div class="body" data-type="string">' +
								'<input type="hidden" class="parent-path"/>' +
								'<div class="input-row key"><label>Key:</label><input type="text" class="key" value=""/></div>' +
								'<div class="add-string input-row"><label>Value:</label><input type="text" value=""/></div>' +
								'<div class="add-number input-row"><label>Value:</label><input type="number" value=""/></div>' +
								'<div class="add-boolean input-row"><label>Value:</label><input type="checkbox"/></div>' +
								'<div class="buttons"><button class="ok">ok</button><button class="cancel">cancel</button></div>' +
							'</div>' + 
						'</div>').appendTo('body');

		var $modalOverlay = $('<div class="tableviewer-modal-overlay" style="display: none"></div>').appendTo('body');

		this.modal = {
			$el : $modal,
			$body : $modal.find('.body'),
			$typeLabel : $modal.find('.title .type-label'),
			$close : $modal.find('.close'),
			$key : $modal.find('.key input'),
			$parentPath : $modal.find('.parent-path'),
			$addString : $modal.find('.add-string'),
			$addStringInput : $modal.find('.add-string input'),
			$addNumber : $modal.find('.add-number'),
			$addNumberInput : $modal.find('.add-number input'),
			$addBoolean : $modal.find('.add-boolean'),
			$addBooleanInput : $modal.find('.add-boolean input'),
			$okButton : $modal.find('.buttons .ok'),
			$cancelButton : $modal.find('.buttons .cancel'),
			$overlay : $modalOverlay
		};


		// Add events
		var that = this;

		var closeSelectors = [
			'.tableviewer-modal .close',
			'.tableviewer-modal .buttons .cancel',
			'.tableviewer-modal-overlay'
		];

		$('body').on('click', closeSelectors.join(','), function(e) {
			that._hideModal();
		});

		// Put element into NetworkTables
		this.modal.$okButton.on('click', function(e) {
			var type = that.modal.$body.attr('data-type');
			var key = that.modal.$parentPath.val() + that.modal.$key.val();
			var value;

			if(type === 'string') {
				value = that.modal.$addStringInput.val();
			} else if(type ==='number') {
				value = parseFloat(that.modal.$addNumberInput.val());
			} else if(type === 'boolean') {
				value = that.modal.$addBooleanInput.prop('checked');
			}

			NetworkTables.putValue(key, value);

			that._hideModal();
		});

	};

	Tableviewer.prototype._showModal = function(parentPath, type) {

		type = ['string', 'number', 'boolean', 'array'].indexOf(type) > -1 ? type : 'string';

		this.modal.$parentPath.val(parentPath ? parentPath : '');
		this.modal.$key.val('');
		this.modal.$body.attr('data-type', type);
		this.modal.$typeLabel.text(type);

		this.modal.$el.css('display', 'block');
		this.modal.$overlay.css('display', 'block');
	};

	Tableviewer.prototype._hideModal = function() {
		this.modal.$el.css('display', 'none');
		this.modal.$overlay.css('display', 'none');
	};

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
			var $el = $('<li class="table" data-path="' + path + '"><button class="collapsed"></button>' + step + '<ul></ul></li>')
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
						'<button class="collapsed"></button>' + 
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