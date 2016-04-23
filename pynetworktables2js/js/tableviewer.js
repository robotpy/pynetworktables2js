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

		var that = this;
		NetworkTables.addGlobalListener(function(key, value, isNew) {
			that._putValue(key, value, 0);
		}, true);

		// Expand/Collabse tables
		$el.on('click', '.expanded, .collapsed', function(e) {
			$(this).toggleClass('expanded collapsed');
		});
	}

	Tableviewer.prototype.printTable = function() {
		console.log(this.ntRoot);
	};

	Tableviewer.prototype._putValue = function(key, value) {
		var steps = key.split('/').filter(function(s) { return s.length > 0; });

		var pathTraveled = '';
		for(var i = 0 ; i < steps.length; i++) {
			var step = steps[i];
			var pathBeforeStep  = pathTraveled;
			pathTraveled += '/' + step;

			// If not last step create table.
			if(i < steps.length - 1) {
				// If path exists and is a table skip this step.
				if(this.ntRoot[pathTraveled] && this.ntRoot[pathTraveled].type === 'table') {
					continue;
				}

				// If path exists and is not a table then it's a value. The value being added/updated is invalid
				if(this.ntRoot[pathTraveled]) {
					return;
				}

				// Otherwise the path doesn't exist so add
				var $el = $('<li class="table"><button class="expanded"></button>' + step + '<ul></ul></li>')
					.appendTo(this.ntRoot[pathBeforeStep].$el);
				this.ntRoot[pathTraveled] = {
					type : 'table',
					$el : $el.find('ul'),
				}
			// Otherwise create value
			} else {
				// If value type is table then value being added/updated is invalid so skip
				if(this.ntRoot[pathTraveled] && this.ntRoot[pathTraveled].type === 'table') {
					return;
				}

				// If path exists and type is not a table then it's a value, so update it.
				if(this.ntRoot[pathTraveled]) {
					// Update type label if array and length of array changes
					if(this.ntRoot[pathTraveled].type === 'array') {
						this.ntRoot[pathTraveled].$type.text(value.type + '[' + value.length + ']');
					}
					this.ntRoot[pathTraveled].$value.text('&nbsp;' + value);
					return;
				}

				// Otherwise path doesn't exist so add
				var type = (typeof(value) === 'object') ? 'array' : typeof(value);
				var typeLabel = (type === 'array') ? (value.type + '[' + value.length + ']') : type;

				if(type === 'array') {
					var $el = $('<li class="array"><button class="expanded"></button>' + step + '<ul></ul></li>')
						.appendTo(this.ntRoot[pathBeforeStep].$el);

					this.ntRoot[pathTraveled] = {
						type : type,
						$el : $el,
						$values : $el.find('ul')
					};
				} else {
					var $el = $('<li class="value"></li>')
						.append('<span class="key">' + step + '</span>')
						.append('<span class="value">' + value + '</span>')
						.append('<span class="type">' + type + '</span>')
						.appendTo(this.ntRoot[pathBeforeStep].$el);

					this.ntRoot[pathTraveled] = {
						type : type,
						$el : $el,
						$key : $el.find('.key'),
						$value : $el.find('.value'),
						$type : $el.find('.type')
					};
				}
			}

		}
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