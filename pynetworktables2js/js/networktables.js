"use strict";

var NetworkTables = new function() {

    if (!("WebSocket" in window)) {
        alert("Your browser does not support websockets, this will fail!");
        return;
    }

    //
    // Utility functions
    //

    /**
     Creates a new empty map (or hashtable) object and returns it. The map
     is safe to store NetworkTables keys in.
     */
    this.create_map = function() {
        return {};
    };

    /**
     Escapes NetworkTables keys so that they're valid HTML identifiers.

     :param key: A networktables key
     :returns: Escaped value
     */
    this.keyToId = encodeURIComponent;

    /**
     Escapes special characters and returns a valid CSS selector. Useful as
     NetworkTables does not really put any limits on what keys can be used.

     :param key: A networktables key
     :returns: Escaped value
     */
    this.keySelector = function(str) {
        return encodeURIComponent(str).replace(/([;&,.+*~':"!^#$%@\[\]()=>|])/g, '\\$1');
    };

    //
    // NetworkTables internal variables
    //


    // functions that listen for connection changes
    var connectionListeners = [];
    var robotConnectionListeners = [];

    // functions that listen for everything
    var globalListeners = [];

    // functions that listen for specific keys
    var keyListeners = this.create_map();

    // contents of everything in NetworkTables that we know about
    var ntCache = this.create_map();

    //
    // NetworkTables JS API
    //

    /**
     Sets a function to be called when the websocket connects/disconnects

     :param f: a function that will be called with a single boolean parameter
     that indicates whether the websocket is connected
     :param immediateNotify: If true, the function will be immediately called
     with the current status of the websocket
     :returns function to stop listening for connection events
     */
    this.addWsConnectionListener = function(f, immediateNotify) {
        connectionListeners.push(f);

        if (immediateNotify === true) {
            f(socketOpen);
        }

        return function() {
            const index = connectionListeners.indexOf(f);
            if (index !== -1) {
                connectionListeners.splice(index, 1);
            }
        }
    };

    /**
     Sets a function to be called when the robot connects/disconnects to the
     pynetworktables2js server via NetworkTables. It will also be called when
     the websocket connects/disconnects.

     :param f: a function that will be called with a single boolean parameter
     that indicates whether the robot is connected
     :param immediateNotify: If true, the function will be immediately called
     with the current robot connection state
     :returns function to stop listening for connection events
     */
    this.addRobotConnectionListener = function(f, immediateNotify) {
        robotConnectionListeners.push(f);

        if (immediateNotify === true) {
            f(robotConnected);
        }

        return function() {
            const index = robotConnectionListeners.indexOf(f);
            if (index !== -1) {
                robotConnectionListeners.splice(index, 1);
            }
        }
    };

    /**
     Set a function that will be called whenever any NetworkTables value is changed

     :param f: When any key changes, this function will be called with the following parameters; key: key name
     for entry, value: value of entry, isNew: If true, the entry has just been created
     :param immediateNotify: If true, the function will be immediately called
     with the current value of all keys
     :returns function to stop listening for connection events
     */
    this.addGlobalListener = function(f, immediateNotify) {
        globalListeners.push(f);

        if (immediateNotify === true) {
            Object.keys(ntCache).forEach(function(key) {
				f(key, ntCache[key], true);
			});
        }

        return function() {
            const index = globalListeners.indexOf(f);
            if (index !== -1) {
                globalListeners.splice(index, 1);
            }
        }
    };

    /**
     Set a function that will be called whenever a value for a particular key is changed in NetworkTables

     :param key: A networktables key to listen for
     :param f: When the key changes, this function will be called with the following parameters; key: key name
     for entry, value: value of entry, isNew: If true, the entry has just been created
     :param immediateNotify: If true, the function will be immediately called
     with the current value of the specified key
     :returns function to stop listening for connection events
     */
    this.addKeyListener = function(key, f, immediateNotify) {
        var listeners = keyListeners[key];
        if (listeners === undefined) {
            keyListeners[key] = [f];
        } else {
            listeners.push(f);
        }

        if (immediateNotify === true) {
            var v = ntCache[key];
            if (v !== undefined) {
                f(key, v, true);
            }
        }

        return function() {
            const index = keyListeners[key].indexOf(f);
            if (index !== -1) {
                connectionListeners.splice(index, 1);
            }
        }
    };

    /**
     Returns true/false if key is in NetworkTables

     .. warning:: This may not return correct results when the websocket is not
     connected
     */
    this.containsKey = function(key) {
        return ntCache[key] !== undefined;
    };

    /**
     Returns all the keys in the NetworkTables

     .. warning:: This may not return correct results when the websocket is not
     connected
     */
    this.getKeys = function() {
        return Object.keys(ntCache);
    };

    /**
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
     */
    this.getValue = function(key, defaultValue) {
        var val = ntCache[key];
        if (val === undefined)
            return defaultValue;
        else
            return val;
    };

    // returns null if robot is not connected, string otherwise
    this.getRobotAddress = function() {
        return robotAddress;
    };

    /**
     * @returns {*} an in-memory cache, which stores keys in a flat-object, instead of a tree
     */
    this.getNtCache = function() {
        return ntCache;
    };

    // returns true if robot is connected
    this.isRobotConnected = function() {
        return robotConnected;
    };

    // returns true if websocket is connected
    this.isWsConnected = function() {
        return socketOpen;
    };

    /**
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
     will be thrown and your robot may crash. You have been warned.
     */
    this.putValue = function(key, value) {
        if (!socketOpen)
            return false;

        if (value === undefined)
            throw new Error(key + ": 'undefined' passed to putValue");

        socket.send(JSON.stringify({'k': key, 'v': value}));
        return true;
    };

    // backwards compatibility; deprecated
    this.setValue = this.putValue;

    //
    // NetworkTables socket code
    //

    var socket;
    var socketOpen = false;
    var robotConnected = false;
    var robotAddress = null;

    // construct the websocket URI
    var loc = window.location;
    var host;

    if (loc.protocol === "https:") {
        host = "wss:";
    } else {
        host = "ws:";
    }

    // If the websocket is being served from a different host allow users
    // to add a data-nt-host="" attribute to the script tag loading
    // Networktables.
    var ntHostElement = document.querySelector('[data-nt-host]');
    if (ntHostElement) {
        var ntHost = ntHostElement.getAttribute('data-nt-host');
        host += "//" + ntHost;
    } else {
        host += "//" + loc.host;
    }

    host += "/networktables/ws";

    function createSocket() {

        socket = new WebSocket(host);
        if (socket) {

            socket.onopen = function() {
                console.log("Socket opened");

                socketOpen = true;

                connectionListeners.forEach(function(listener) {
                    listener(true)
                });
            };

            socket.onmessage = function(msg) {
                var data = JSON.parse(msg.data);

                // robot connection event
                if (data.r !== undefined) {
                    robotConnected = data.r;
                    robotAddress = data.a;
                    robotConnectionListeners.forEach(function(listener) {
                        listener(robotConnected)
                    });
                } else {

                    // data changed on websocket
                    var key = data['k'];
                    var value = data['v'];
                    var isNew = data['n'];

                    ntCache[key] = value;

                    // notify global listeners
                    globalListeners.forEach(function(listener) {
                        listener(key, value, isNew)
                    });

                    // notify key-specific listeners
                    var listeners = keyListeners[key];
                    if (listeners !== undefined) {
                        listeners.forEach(function(listener) {
                            listener(key, value, isNew)
                        });
                    }
                }
            };

            socket.onclose = function() {

                if (socketOpen) {

                    connectionListeners.forEach(function(listener) {
                        listener(false)
                    });

                    robotConnectionListeners.forEach(function(value) {
                        value(false);
                    });

                    // clear ntCache, it's no longer valid
                    // TODO: Is this true?
                    ntCache = {};

                    socketOpen = false;
                    robotConnected = false;
                    robotAddress = null;
                    console.log("Socket closed");
                }

                // respawn the websocket
                setTimeout(createSocket, 300);
            };
        }
    }

    createSocket();
};


