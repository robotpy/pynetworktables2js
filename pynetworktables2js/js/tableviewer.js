"use strict";

(function() {

	if ($ === undefined) {
	    alert("jQuery must be downloaded+included to use tableviewer.js!");
	    return;
	}

	function Tableviewer($el) {
		this.$el = $el;
		this.ntRoot = {
			'' : {
				type : 'table',
				$el : $('<ul></ul>').appendTo($el)
			}
		};

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
				var $li = $('<li>' + step + '</li>').appendTo(this.ntRoot[pathBeforeStep].$el);
				this.ntRoot[pathTraveled] = {
					type : 'table',
					$el : $('<ul></ul>').appendTo($li)
				}
			// Otherwise create value
			} else {
				// If value type is table then value being added/updated is invalid so skip
				if(this.ntRoot[pathTraveled] && this.ntRoot[pathTraveled].type === 'table') {
					return;
				}

				// If path exists and type is not a table then it's a value, so update it.
				if(this.ntRoot[pathTraveled]) {
					this.ntRoot[pathTraveled].$el.text(step + ': ' + value);
					return;
				}

				// Otherwise path doesn't exist so add
				var type = (typeof(value) === 'object') ? 'array' : typeof(value);
				this.ntRoot[pathTraveled] = {
					type : type,
					$el : $('<li>' + step + ': ' + value + '</li>').appendTo(this.ntRoot[pathBeforeStep].$el)
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