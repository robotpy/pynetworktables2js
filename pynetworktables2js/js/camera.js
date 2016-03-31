"use strict";

// creates svg element
function $s(elem) {
    return $(document.createElementNS('http://www.w3.org/2000/svg', elem));
}

function loadCameraOnConnect(args) {
    /* 
        problem: if you load the image before connecting to the robot, it may
        never connect, and image loads aren't cancelable. Instead, wait for
        NetworkTables to connect, and then try to load a data file from the
        camera server. If that succeeds, then we load the image.
        
        It's a bit complicated, but it should work reasonably well..
    */
    
    var container = $(args.container);
    var attrs = args.attrs || {};
    if (!attrs.width) {
        attrs.width = 640;
        attrs.height = 480;
    }
    
    var cx = Math.round(attrs.width/2.0);
    var cy = Math.round(attrs.height/2.0);
    var cx1 = cx - 20, cx2 = cx + 20,
        cy1 = cy - 20, cy2 = cy + 20;
    
    var xhr = null;
    var tid = null;
    
    function create_remote_uri(path) {
        var camera_url = args.host;
        if (!camera_url) {
            camera_url = NetworkTables.getRobotAddress();
        }
        
        if (args.proto) {
            camera_url = args.proto + camera_url;
        } else {
            if (!camera_url.startsWith('http://') && !camera_url.startsWith('https://')) {
                camera_url = 'http://' + camera_url;
            }
        }
        
        if (args.port)
            camera_url = camera_url + ':' + args.port;
        
        return camera_url + path;
    }
    
    function set_container(e) {
        container.empty();
        container.append(e);
    }
    
    function set_img(params) {
        set_container($('<img>', $.extend({}, attrs, params)));
    }
    
    function set_svg() {
        var e = $s('svg');
        e.attr($.extend({}, attrs, {style: 'background-color: black'}));
        set_container(e);
        return e;
    }
    
    function onWaiting() {
        if (args.wait_img) {
            set_img({src: args.wait_img});
        } else {
            var e = set_svg();
            //e.append($s('circle').attr({cx: cx, cy: cy, r: 50, fill: 'orange'}));
            e.append($s('line').attr({stroke: 'red', 'stroke-width': 10,
                                      x1: cx1, x2: cx2, y1: cy1, y2: cy2}));
            e.append($s('line').attr({stroke: 'red', 'stroke-width': 10,
                                      x1: cx2, x2: cx1, y1: cy1, y2: cy2}));
        }
    }
    
    function onSuccess() {
        set_img({src: create_remote_uri(args.image_url)});
    }
    
    function onError() {
        container.empty();
        if (args.error_img) {
            set_img({src: args.error_img});
        } else {
            var e = set_svg();
            e.append($s('polyline').attr({fill: 'orange', stroke: 'red',
                'stroke-width': 4,
                points: '' + cx + ',' + cy1 + ' ' + 
                        cx1 + ',' + cy2 + ' ' + 
                        cx2 + ',' + cy2 + ' ' + 
                        cx + ',' + cy1}));
        }
    }
    
    function tryConnect() {
        if (xhr != null) {
            xhr.abort();
            xhr = null;
        }
            
        if (!NetworkTables.isRobotConnected())
            return;
        
        console.log("Trying " + create_remote_uri(args.data_url));
        
        xhr = $.jsonp({
            url: create_remote_uri(args.data_url),
            error: function() {
                console.log("error");
                xhr = null;
                
                if (NetworkTables.isRobotConnected()) {
                    onError();
                }
            },
            success: function() {
                console.log("ok");
                clearTimeout(tid);
                tid = null;
                xhr = null;
                onSuccess();
            }
        });
        
        setTimeout(tryConnect, 1000);
    }
    
    function onRobotConnection(connected) {
        onWaiting();
        
        if (connected) {
            tryConnect();
        } else {
            // cancel any outstanding timeouts
            if (tid != null) {
                clearTimeout(tid);
                tid = null;
            }
            
            if (xhr != null) {
                xhr.abort();
                xhr = null;
            }
        }
    }
    
    NetworkTables.addRobotConnectionListener(onRobotConnection, true);
}
