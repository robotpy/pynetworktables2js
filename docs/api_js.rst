JS API: NetworkTables
=====================

To use these functions, add this to your HTML page:

.. code-block:: html

    <script src="/networktables/networktables.js"></script>

**Note**:

It's very important to note that the Javascript NetworkTables API currently
has no concept of a table or subtable. When referring to keys when accessing
the API you must use absolute paths, and not just key names. For example,
if you use ``SmartDashboard.putNumber('foo', 1)`` to put a value called ``foo``,
then to access the value using the Javascript API you would use
``NetworkTables.getValue('/SmartDashboard/foo')``.

Listeners
---------

These functions allow your code to listen for particular NetworkTables events.

.. js:function:: NetworkTables.addWsConnectionListener(f[, immediateNotify])

    Sets a function to be called when the websocket connects/disconnects

    :param f: a function that will be called with a single boolean parameter
              that indicates whether the websocket is connected
    :param immediateNotify: If true, the function will be immediately called
                            with the current status of the websocket

    Example usage:

    .. code-block:: javascript

        NetworkTables.addWsConnectionListener(function(connected){
            console.log("Websocket connected: " + connected);
        }, true);

.. js:function:: NetworkTables.addRobotConnectionListener(f[, immediateNotify])

    Sets a function to be called when the robot connects/disconnects to the
    pynetworktables2js server via NetworkTables. It will also be called when
    the websocket connects/disconnects.
    
    When a listener function is called with a 'true' parameter, the 
    NetworkTables.getRobotAddress() function will return a non-null value.

    :param f: a function that will be called with a single boolean parameter
              that indicates whether the robot is connected
    :param immediateNotify: If true, the function will be immediately called
                            with the current robot connection state

    Example usage:

    .. code-block:: javascript

        NetworkTables.addRobotConnectionListener(function(connected){
            console.log("Robot connected: " + connected);
        }, true);

.. js:function:: NetworkTables.addGlobalListener(f[, immediateNotify])

    Set a function that will be called whenever any NetworkTables value is changed

    :param f: When any key changes, this function will be called with the following parameters; key: key name
              for entry, value: value of entry, isNew: If true, the entry has just been created
    :param immediateNotify: If true, the function will be immediately called
                            with the current value of all keys

    Example usage:

    .. code-block:: javascript

        NetworkTables.addGlobalListener(function(key, value, isNew){
            // do something with the values as they change
        }, true);

.. js:function:: NetworkTables.addKeyListener(key, f[, immediateNotify])

    Set a function that will be called whenever a value for a particular key is changed in NetworkTables

    :param key: A networktables key to listen for
    :param f: When the key changes, this function will be called with the following parameters; key: key name
              for entry, value: value of entry, isNew: If true, the entry has just been created
    :param immediateNotify: If true, the function will be immediately called
                            with the current value of the specified key

    Example usage:

    .. code-block:: javascript

        NetworkTables.addKeyListener(function(key, value, isNew){
            // do something with the values as they change
        }, true);

NetworkTables Interface
-----------------------

.. js:function:: NetworkTables.containsKey(key)

    Use this to test whether a value is present in the table or not

    :param key: A networktables key
    :returns: true if a key is present in NetworkTables, false otherwise

    .. warning:: This may not return correct results when the websocket is not
                 connected
    
.. js:function:: NetworkTables.getKeys()

    :returns: all the keys in the NetworkTables

    .. warning:: This may not return correct results when the websocket is not
                 connected

.. js:function:: NetworkTables.getValue(key[, defaultValue])

    Returns the value that the key maps to. If the websocket is not
    open, this will always return the default value specified.

    :param key: A networktables key
    :param defaultValue: If the key isn't present in the table, return this instead
    :returns: value of key if present, ``undefined`` or ``defaultValue`` otherwise

    .. warning:: This may not return correct results when the websocket is not
                 connected

    .. note:: To make a fully dynamic webpage that updates when the robot
              updates values, it is recommended (and simpler) to use
              :func:`addKeyListener` or :func:`addGlobalListener` to listen
              for changes to values, instead of using this function.
              
.. js:function:: NetworkTables.getRobotAddress()

    :returns: null if the robot is not connected, or a string otherwise

.. js:function:: NetworkTables.isRobotConnected()

    :returns: true if the robot is connected

.. js:function:: NetworkTables.isWsConnected()

    :returns: true if the websocket is connected

.. js:function:: NetworkTables.putValue(key)

    Sets the value in NetworkTables. If the websocket is not connected, the
    value will be discarded.

    :param key: A networktables key
    :param value: The value to set (see warnings)
    :returns: True if the websocket is open, False otherwise

    .. note:: When you put a value, it will not be immediately available
              from ``getValue``. The value must be sent to the NetworkTables
              server first, which will then send the change notification
              back up to the javascript NetworkTables key/value cache.

    .. warning:: NetworkTables is type sensitive, whereas Javascript is loosely
                 typed. This function will **not** check the type of the value
                 that you are trying to put, so you must be careful to only put
                 the correct values that are expected. If your robot tries to
                 retrieve the value and it is an unexpected type, an exception
                 will be thrown and your robot may crash. Make sure you test
                 your code -- you have been warned.

Utility functions
-----------------

.. js:function:: NetworkTables.create_map()

    Creates a new empty map (or hashtable) object and returns it. The map
    is safe to store NetworkTables keys in.

    :returns: map object, with forEach/get/has/set functions defined. Simlar
              to a map object when using d3.js

.. js:function:: NetworkTables.keyToId(key)

    Escapes NetworkTables keys so that they're valid HTML identifiers.

    :param key: A networktables key
    :returns: Escaped value

.. js:function:: NetworkTables.keySelector(key)

    Escapes special characters and returns a valid jQuery selector. Useful as
    NetworkTables does not really put any limits on what keys can be used.

    :param key: A networktables key
    :returns: Escaped value

    For example, to set the text of an element which has an id that corresponds to
    a value in NetworkTables:

    .. code-block:: javascript

        $('#' + NetworkTables.keySelector(key)).text(value);

