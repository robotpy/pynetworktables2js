"use strict";

const NetworkTables = new function() {
    /**
     * Maps each socket state to its underlying numeric representation
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
     */
    const SOCKET_STATE = {
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3
    };

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws";
    /**
     * Find an element with a data-nt-host attribute, which will specify the server's address
     * @type {Element}
     */
    const ntHostElement = document.querySelector('[data-nt-host]');
    const address = ntHostElement ? ntHostElement.getAttribute('data-nt-host') : window.location.host;
    const socketAddress = `${protocol}//${address}/networktables/ws`;

    let socket = new WebSocket(socketAddress);
    let robot = {
        address: null,
        connected: false
    };

    /**
     * Generates a valid HTML identifier from a NetworkTable key
     * @deprecated This is here for compatibility with older programs. Please use encodeURIComponent directly
     */
    this.keyToId = encodeURIComponent;

    /**
     * Generates a valid CSS selector from a NetworkTable key
     * @param {String} key A NetworkTable key
     * @returns {string} A valid CSS selector
     */
    this.keySelector = function(key) {
        return encodeURIComponent(key).replace(/([;&,.+*~':"!^#$%@\[\]()=>|])/g, '\\$1');
    };

    const connectionListeners = new Set();
    const robotConnectionListeners = new Set();
    const globalListeners = new Set();

    const keyListeners = new Map();
    let ntCache = new Map(); // Store all discovered values in memory

    /**
     * Listen for the websocket to connect or disconnect from the server
     * @param {function(boolean)} f Called when the websocket's readyState changes
     * @param {boolean} immediateNotify Whether f should be called with the current connection status
     * @returns {function(): boolean} a function you can call to stop listening
     */
    this.addWsConnectionListener = function(f, immediateNotify = false) {
        connectionListeners.add(f);

        if (immediateNotify) f(socket.readyState === SOCKET_STATE.OPEN);

        return () => connectionListeners.delete(f);
    };

    /**
     * Listen for the robot to connect or disconnect from the server
     * @param {function(boolean)} f Called when the server connects the robot
     * @param {boolean} immediateNotify Whether f should be called with the current connection status
     * @returns {function(): boolean} a function you can call to stop listening
     */
    this.addRobotConnectionListener = function(f, immediateNotify = false) {
        robotConnectionListeners.add(f);

        if (immediateNotify) f(robot.connected);

        return () => robotConnectionListeners.delete(f)
    };

    /**
     * Listen for any key changes on any table or subtable
     * @param {function(string, *, boolean)} f Called when a key's value is changed
     * @param {boolean} immediateNotify Whether f should be called with the current keys
     * @returns {function(): boolean} a function you can call to stop listening
     */
    this.addGlobalListener = function(f, immediateNotify = false) {
        globalListeners.add(f);

        if (immediateNotify) ntCache.forEach((key, value) => f(key, value, true));

        return () => globalListeners.delete(f);
    };

    /**
     * Listen for a key to get a new value
     * @param {string} key A NetworkTable key
     * @param {function(string, *, boolean)} f Called when the key gets a new value
     * @param {boolean} immediateNotify Whether f should be called with the current value
     * @returns {function(): boolean} a function you can call to stop listening
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
            if (v !== undefined) f(key, v, true);
        }

        return () => keyListeners.delete(key);
    };

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {string} key A NetworkTable key
     * @returns {boolean} true if NetworkTables contains the key
     */
    this.containsKey = function(key) {
        return ntCache.has(key);
    };

    /**
     * @returns {IterableIterator<*>} a list of keys in the NetworkTable
     */
    this.getKeys = function() {
        return ntCache.keys();
    };

    /**
     * @param {string} key A NetworkTable key
     * @param defaultValue The value to return if the key does not have an attached value
     * @returns {*} the value corresponding to key, or defaultValue of that is not present
     */
    this.getValue = function(key, defaultValue) {
        const val = ntCache.get(key);
        if (val === undefined)
            return defaultValue;
        else
            return val;
    };

    /**
     * @returns {string | null} the robot's IP address, or null if it is not connected
     */
    this.getRobotAddress = function() {
        return robot.address;
    };

    /**
     * @returns {boolean} true if the robot is connected to the server
     */
    this.isRobotConnected = function() {
        return robot.connected;
    };

    /**
     * @returns {boolean} true if the websocket is connected to the server
     */
    this.isWsConnected = function() {
        return socket.readyState === SOCKET_STATE.OPEN;
    };

    /**
     * Updates the value in the NetworkTable. Remember that the value provided should be of the correct type, and if it
     * is not, may crash your robot. You've been warned.
     * @param {string} key A NetworkTable key
     * @param {*} value The value to put in the NetworkTable at key
     * @returns {boolean} true if the operation was queued
     */
    this.putValue = function(key, value) {
        if (socket.readyState !== SOCKET_STATE.OPEN) return false;

        if (value === undefined) throw new Error(key + ": 'undefined' passed to putValue");

        socket.send(JSON.stringify({'k': key, 'v': value}));
        return true;
    };

    function createSocket() {
        socket = new WebSocket(socketAddress);

        socket.onopen = function() {
            console.info("Socket opened");
            connectionListeners.forEach(listener => listener(true));
        };

        socket.onmessage = function(msg) {
            const data = JSON.parse(msg.data);

            // robot connection event
            if (data.r !== undefined) {
                // noinspection JSUnresolvedVariable
                robot = {
                    address: data.a,
                    connected: data.r
                };
                robotConnectionListeners.forEach(listener => listener(true));
            } else {
                // data changed on websocket
                const key = data['k'];
                const value = data['v'];
                const isNew = data['n'];

                ntCache.set(key, value);

                // notify global listeners
                globalListeners.forEach(listener => listener(key, value, isNew));

                // notify key-specific listeners
                const listeners = keyListeners.get(key);
                if (listeners !== undefined) {
                    listeners.forEach(listener => listener(key, value, isNew));
                }
            }
        };

        socket.onclose = function() {
            connectionListeners.forEach(listener => listener(false));
            robotConnectionListeners.forEach(listener => listener(false));

            ntCache = new Map(); // The cache is no longer valid, so we'll clear it

            robot = {
                address: null,
                connected: false
            };
            console.info("Socket closed");

            setTimeout(createSocket, 300);
        };
    }

    createSocket();
};
