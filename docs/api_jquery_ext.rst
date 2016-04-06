JS API: JQuery Extensions
=========================

.. code-block:: html

    <script src="/networktables/jquery_ext.js"></script>
    
.. note:: These functions require `jQuery <http://jquery.com/>`_ to be
          loaded first!

.. js:function:: $.nt_toggle(key, function)
	
	When a networktables variable changes, a checkbox element will be updated
	when a NT variable changes and when a user clicks it.

	Alternatively, you can use this with custom elements, by providing a function
	that will be called only when the NT value is changed. The NT value will be
	toggled when the user clicks the selected element(s).

	:param k: Networktables key
	:param fn: (optional) function that accepts a single param, will be called on change
	:param evt: (optional) Which event to toggle the value on (defaults to 'click')

	Example usage:

	.. code-block:: javascript

		// this works on a checkbox
		$('#my_checkbox').nt_toggle('/SmartDashboard/some_boolean');

		// or on a clickable element
		$('#my_clickable').nt_toggle('/SmartDashboard/b', function(v) {
			this.css('background-color', v ? 'green' : 'gray');
		});
