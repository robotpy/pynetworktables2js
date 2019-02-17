"use strict";

const NetworkTables = new function() {


    let robotAddress;
//
    let robotConnected;
// NetworkTables socket code
    let socketOpen;
//
    let socket;
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
        return new Map();
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
    const connectionListeners = new Set();
    const robotConnectionListeners = new Set();

    // functions that listen for everything
    const globalListeners = new Set();

    // functions that listen for specific keys
    const keyListeners = new Map();

    // contents of everything in NetworkTables that we know about
    let ntCache = new Map();

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
    this.addWsConnectionListener = function(f, immediateNotify = false) {
        connectionListeners.add(f);

        if (immediateNotify) {
            f(socketOpen);
        }

        return () => connectionListeners.delete(f);
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
    this.addRobotConnectionListener = function(f, immediateNotify = false) {
        robotConnectionListeners.add(f);

        if (immediateNotify) {
            f(robotConnected);
        }

        return () => robotConnectionListeners.delete(f);
    };

    /**
     Set a function that will be called whenever any NetworkTables value is changed

     :param f: When any key changes, this function will be called with the following parameters; key: key name
     for entry, value: value of entry, isNew: If true, the entry has just been created
     :param immediateNotify: If true, the function will be immediately called
     with the current value of all keys
     :returns function to stop listening for connection events
     */
    this.addGlobalListener = function(f, immediateNotify = false) {
        globalListeners.push(f);

        if (immediateNotify) {
            ntCache.forEach(function(k, v) {
                f(k, v, true);
            });
        }

        return () => globalListeners.delete(f);
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
    this.addKeyListener = function(key, f, immediateNotify = false) {
        const listeners = keyListeners.get(key);
        if (listeners === undefined) {
            keyListeners.set(key, new Set([f]));
        } else {
            listeners.add(f);
        }

        if (immediateNotify) {
            const v = ntCache.get(key);
            if (v !== undefined) {
                f(key, v, true);
            }
        }

        return () => keyListeners.delete(key);
    };

    /**
     Returns true/false if key is in NetworkTables

     .. warning:: This may not return correct results when the websocket is not
     connected
     */
    this.containsKey = function(key) {
        return ntCache.has(key);
    };

    /**
     Returns all the keys in the NetworkTables

     .. warning:: This may not return correct results when the websocket is not
     connected
     */
    this.getKeys = function() {
        return ntCache.keys();
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
        const val = ntCache.get(key);
        if (val === undefined)
            return defaultValue;
        else
            return val;
    };

    // returns null if robot is not connected, string otherwise
    this.getRobotAddress = function() {
        return robotAddress;
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
    socketOpen = false;
    robotConnected = false;
    robotAddress = null;

    // construct the websocket URI
    const loc = window.location;
    let host;

    if (loc.protocol === "https:") {
        host = "wss:";
    } else {
        host = "ws:";
    }

    // If the websocket is being served from a different host allow users
    // to add a data-nt-host="" attribute to the script tag loading
    // Networktables.
    const ntHostElement = document.querySelector('[data-nt-host]');
    if (ntHostElement) {
        const ntHost = ntHostElement.getAttribute('data-nt-host');
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

                connectionListeners.forEach(f => f(true));
            };

            socket.onmessage = function(msg) {
                const data = JSON.parse(msg.data);

                // robot connection event
                if (data.r !== undefined) {
                    robotConnected = data.r;
                    robotAddress = data.a;
                    robotConnectionListeners.forEach(f => f(robotConnected));
                } else {

                    // data changed on websocket
                    const key = data['k'];
                    const value = data['v'];
                    const isNew = data['n'];

                    ntCache.set(key, value);

                    // notify global listeners
                    globalListeners.forEach(f => f(key, value, isNew));

                    // notify key-specific listeners
                    const listeners = keyListeners.get(key);
                    if (listeners !== undefined) {
                        listeners.forEach(f => f(key, value, isNew));
                    }
                }
            };

            socket.onclose = function() {

                if (socketOpen) {

                    connectionListeners.forEach(f => f(false));

                    robotConnectionListeners.forEach(f => f(false));

                    // clear ntCache, it's no longer valid
                    // TODO: Is this true?
                    ntCache = new Map();

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


