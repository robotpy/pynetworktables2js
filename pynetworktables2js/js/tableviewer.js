"use strict";

(function() {

	if ($ === undefined) {
	    alert("jQuery must be downloaded+included to use tableviewer.js!");
	    return;
	}

	function Tableviewer($el) {
		this.$el = $el;
	}


	// jQuery plugin
	$.fn.extend({
		tableviewer:  function() {
			return this.each(function() {
				var $el = $(this);
				var tableviewer = $el.data('tableviewer');
				
				// Initialize tableviewer
				if(typeof(tableviewer) === 'undefined') {
					$el.data('tableviewer', new Tableviewer($el));
				// Call tableviewer function
				} else {
					var args = [...arguments];
					Tableviewer.prototype[args.shift()].call(tableviewer, args);
				}
			});
		}

})();