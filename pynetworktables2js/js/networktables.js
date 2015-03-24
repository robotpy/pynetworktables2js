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
	
	// creates a new map object and returns it. The map is safe to store
	// NetworkTables keys in
	this.create_map = function() {
		return new d3_map();
	};
	
	// Escapes SD keys so that they're valid HTML identifiers
	this.keyToId = encodeURIComponent;
	
	// Escapes special characters and returns a valid jQuery selector
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
	
	// Sets functions to be called when the websocket connects/disconnects
	// - f takes single parameter true/false for connected/disconnected
	this.addWsConnectionListener = function(f, immediateNotify) {
		connectionListeners.push(f);
		
		if (immediateNotify == true) {
			f(socketOpen);
		}
	};
	
	// Sets functions to be called when the robot connects/disconnects
	// - This isn't meaningful if your server is a robot
	this.addRobotConnectionListener = function(f, immediateNotify) {
		robotConnectionListeners.push(f);
		
		if (immediateNotify == true) {
			f(robotConnected);
		}
	}
	
	// Set a function that will be called whenever any value
	// is changed in the table
	this.addGlobalListener = function(f, immediateNotify) {
		globalListeners.push(f);
		
		if (immediateNotify == true) {
			ntCache.forEach(function(k, v){
				f(k, v, true);
			});
		}
	};
	
	// Set a function that will be called whenever a value for a particular
	// key is changed in the table
	this.addKeyListener = function(key, f, immediateNotify) {
		var listeners = keyListeners.get(key);
		if (listeners !== undefined) {
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
	
	// Returns true/false if key is in NetworkTable
	this.containsKey = function(key) {
		return ntCache.has(key);
	};
	
	// Returns a NetworkTable value (cached)
	this.getValue = function(key) {
		return ntCache.get(key);
	};
	
	// returns True if websocket is connected
	this.isConnected = function() {
		return socketOpen;
	};
	
	// Sets a NetworkTable value
	// - Nothing happens if NetworkTables isn't connected
	this.setValue = function(key, value) {
		if (socketOpen) {
			socket.send(JSON.stringify({'k': key, 'v': value}));
		}
	};
	
	//
	// NetworkTables socket code
	//
	
	var socket;
	var socketOpen = false;
	var robotConnected = false;
	
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
					console.log("Socket closed");
				}
				
				// respawn the websocket
				setTimeout(createSocket, 300);
			};
		}
	}
	
	createSocket();
}


