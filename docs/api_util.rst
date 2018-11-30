JS API: Utilities
=================

To use these functions, add this to your HTML page:

.. code-block:: html

    <script src="/networktables/utils.js"></script>

.. note:: These functions require `jQuery <http://jquery.com/>`_ and
          `D3 <https://d3js.org/>`_ to be loaded first!

The functions in this file are still experimental in nature, and as we
expand the number of functions in this file it is expected that the API
will change.

SendableChooser
---------------

.. js:function:: attachSelectToSendableChooser(html_id, nt_key)

    Given the id of an HTML ``<select>`` element and the key name of a SendableChooser
    object setup in networktables, this will sync the select combo box with the
    contents of the SendableChooser, and you will be able to select an object
    using the select element.

    :param html_id: An ID of an HTML select element
    :param nt_key: The name of the NetworkTables key that the SendableChooser
                   is associated with

    See the WPILib documentation for information on how to use SendableChooser
    in your robot's program.

.. js:function:: updateSelectWithChooser(html_id, nt_key)

    This function is designed to be used from the onValueChanged callback
    whenever values from a SendableChooser change, but you probably should
    prefer to use attachSelectToSendableChooser instead.

    See attachSelectToSendableChooser documentation.

Indicators
----------

.. js:function:: attachRobotConnectionIndicator(html_id[, size, stroke_width])

    Creates a circle SVG that turns red when robot is not connected, green when
    it is connected.

    :param html_id: ID to insert svg into
    :param size: Size of circle
    :param stroke_width: Border of circle
