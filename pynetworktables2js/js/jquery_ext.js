"use strict";

if ($ === undefined) {
    alert("jQuery must be downloaded+included to use jquery_ext.js!");
}


/**
	$.nt_toggle(key, function)
	
	When a networktables variable changes, a checkbox element will be updated
	when a NT variable changes and when a user clicks it.

	Alternatively, you can use this with custom elements, by providing a function
	that will be called only when the NT value is changed. The NT value will be
	toggled when the user clicks the selected element(s).

	:param k: Networktables key
	:param fn: (optional) function that accepts a single param, will be called on change
	:param evt: (optional) Which event to toggle the value on (defaults to 'click')
	
*/
$.fn.extend({
	nt_toggle: function(k, fn, evt) {

		if (fn == null) {
			evt = 'change';
			fn = function(v) {
				// by default, assume that it's a checkbox
				$(this).each(function() {
					$(this).prop('checked', v);
				});
			}
		}

		fn = fn.bind(this);

		if (evt == null)
			evt = 'click';

		// only call the function when the key changes -- not when the user 
		// clicks it (this allows simultaneous pages to function correctly)
		NetworkTables.addKeyListener(k, function(k, v) {
			fn(v);
		}, true);
		
		return this.each(function() {
			$(this).on(evt, function() {
				NetworkTables.setValue(k, NetworkTables.getValue(k) ? false : true);
			});
		});
	}
});