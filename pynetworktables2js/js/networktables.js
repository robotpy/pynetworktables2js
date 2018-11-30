"use strict";

var NetworkTables = new function () {
	
	if (!("WebSocket" in window)) {
		alert("Your browser does not support websockets, this will fail!");
		return;
	}
	
	//
	// javascript map implementation
	// map functions copied from d3 (BSD license: Mike Bostock)
	//
	
	var d3_map_proto = "__proto__", d3_map_zero = "\x00";
	
	// we use encodeURIComponent/decodeURIComponent to allow weird values
	// into the maps we create
	
	function d3_map_escape(key) {
		return (key += "") === d3_map_proto || key[0] === d3_map_zero ? d3_map_zero + encodeURIComponent(key) : encodeURIComponent(key);
	}
	
	function d3_map_unescape(key) {
		return (key += "")[0] === d3_map_zero ? decodeURIComponent(key.slice(1)) : decodeURIComponent(key);
	}
	
	var d3_map = function() {
		
		this._ = Object.create(null); 
		
		this.forEach = function(f) {
			for (var key in this._) f.call(this, d3_map_unescape(key), this._[key]);
		};
		
		this.get = function(key) {
			return this._[d3_map_escape(key)];
		};
		
		this.getKeys = function() {
			var keys = [];
			for(var key in this._) keys.push(d3_map_unescape(key));
			return keys;
		};
		
		this.has = function(key) {
			return d3_map_escape(key) in this._;
		};
		
		this.set = function(key, value) {
			return this._[d3_map_escape(key)] = value;
		};
	};
	
	//
	// Utility functions
	//
	
	/**
		Creates a new empty map (or hashtable) object and returns it. The map
    	is safe to store NetworkTables keys in.
    */
	this.create_map = function() {
		return new d3_map();
	};
	
	/**
		Escapes NetworkTables keys so that they're valid HTML identifiers.

		:param key: A networktables key
    	:returns: Escaped value
    */
	this.keyToId = encodeURIComponent;
	
	/**
		Escapes special characters and returns a valid jQuery selector. Useful as
    	NetworkTables does not really put any limits on what keys can be used.

    	:param key: A networktables key
    	:returns: Escaped value
    */
	this.keySelector = function(str) {
	    return encodeURIComponent(str).replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
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
	var keyListeners = new d3_map();
	
	// contents of everything in NetworkTables that we know about
	var ntCache = new d3_map();
	
	//
	// NetworkTables JS API
	//
	
	/**
		Sets a function to be called when the websocket connects/disconnects

	    :param f: a function that will be called with a single boolean parameter
	              that indicates whether the websocket is connected
	    :param immediateNotify: If true, the function will be immediately called
	                            with the current status of the websocket
    */
	this.addWsConnectionListener = function(f, immediateNotify) {
		connectionListeners.push(f);
		
		if (immediateNotify == true) {
			f(socketOpen);
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
	*/
	this.addRobotConnectionListener = function(f, immediateNotify) {
		robotConnectionListeners.push(f);
		
		if (immediateNotify == true) {
			f(robotConnected);
		}
	}
	
	/**
		Set a function that will be called whenever any NetworkTables value is changed

	    :param f: When any key changes, this function will be called with the following parameters; key: key name
	              for entry, value: value of entry, isNew: If true, the entry has just been created
	    :param immediateNotify: If true, the function will be immediately called
	                            with the current value of all keys
    */
	this.addGlobalListener = function(f, immediateNotify) {
		globalListeners.push(f);
		
		if (immediateNotify == true) {
			ntCache.forEach(function(k, v){
				f(k, v, true);
			});
		}
	};
	
	/**
	    Set a function that will be called whenever a value for a particular key is changed in NetworkTables

	    :param key: A networktables key to listen for
	    :param f: When the key changes, this function will be called with the following parameters; key: key name
	              for entry, value: value of entry, isNew: If true, the entry has just been created
	    :param immediateNotify: If true, the function will be immediately called
	                            with the current value of the specified key
	*/
	this.addKeyListener = function(key, f, immediateNotify) {
		var listeners = keyListeners.get(key);
		if (listeners === undefined) {
			keyListeners.set(key, [f]);
		} else {
			listeners.push(f);
		}
		
		if (immediateNotify == true) {
			var v = ntCache.get(key);
			if (v !== undefined) {
				f(key, v, true);
			}
		}
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
		return ntCache.getKeys();
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
		var val = ntCache.get(key);
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
	
	host += "//" + loc.host;
	host += "/networktables/ws";
	
	function createSocket() {
	
		socket = new WebSocket(host);
		if (socket) {
			
			socket.onopen = function() {
				console.log("Socket opened");
				
				socketOpen = true;
				
				for (var i in connectionListeners) {
					connectionListeners[i](true);
				}
			};
			
			socket.onmessage = function(msg) {
				var data = JSON.parse(msg.data);
				
				// robot connection event
				if (data.r !== undefined) {
					robotConnected = data.r;
					robotAddress = data.a;
					for (var i in robotConnectionListeners) {
						robotConnectionListeners[i](robotConnected);
					}
				} else {
				
					// data changed on websocket
					var key = data['k'];
					var value = data['v'];
					var isNew = data['n'];
					
					ntCache.set(key, value);
					
					// notify global listeners
					for (var i in globalListeners) {
						globalListeners[i](key, value, isNew);
					}
					
					// notify key-specific listeners
					var listeners = keyListeners.get(key);
					if (listeners !== undefined) {
						for (var i in listeners) {
							listeners[i](key, value, isNew);
						}
					}
				}
			};
			
			socket.onclose = function() {
				
				if (socketOpen) {
				
					for (var i in connectionListeners) {
						connectionListeners[i](false);
					}
					
					for (var i in robotConnectionListeners) {
						robotConnectionListeners[i](false);
					}
					
					// clear ntCache, it's no longer valid
					// TODO: Is this true?
					ntCache = new d3_map();
					
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
}


