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

    if (!args.timeout)
        args.timeout = 1000;
    
    var cx = Math.round(attrs.width/2.0);
    var cy = Math.round(attrs.height/2.0);
    var cx1 = cx - 20, cx2 = cx + 20,
        cy1 = cy - 20, cy2 = cy + 20;
    
    var xhr = null;
    var tid = null;
    var errors = 0;
    
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
        errors = 0;
        if (args.wait_img) {
            set_img({src: args.wait_img});
        } else {
            var e = set_svg();
            e.append($s('line').attr({stroke: 'red', 'stroke-width': 10,
                                      x1: cx1, x2: cx2, y1: cy1, y2: cy2}));
            e.append($s('line').attr({stroke: 'red', 'stroke-width': 10,
                                      x1: cx2, x2: cx1, y1: cy1, y2: cy2}));
        }
    }
    
    function onSuccess() {
        var webcam_url = create_remote_uri(args.image_url);
        errors = 0;
        clearTimeout(tid);
        tid = null;
        xhr = null;

        console.log("loadCameraOnConnect: successfully connected to server, loading webcam at " + webcam_url);
        set_img({src: webcam_url});
    }
    
    function onError() {
        errors += 1;
        container.empty();
        if (errors < 3) {
            // set black background for 3 seconds
            set_svg();
        } else if (args.error_img) {
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

        var detect_uri = create_remote_uri(args.data_url);
        
        if (errors == 0)
            console.log("loadCameraOnConnect: Detecting webcam server via connection to " + detect_uri);
        
        // hack: need to determine whether the other side is listening, so we
        // we make an HTTP request that can be aborted. However, if this is to
        // work on webcams that we can't control the source code for (such as
        // an Axis camera), we can't mandate that the other side set an
        // appropriate CORS header, so we can't use a normal AJAX call or we run
        // into cross-domain problems.
        // 
        // all we care about is that the remote server was successfully talked
        // to, so we use JSONP which will work cross domain, and if the error 
        // returned is 'parsererror' then we know that *something* was loaded
        // from the other side, so that's good enough.
        //
        // Only tested on Chrome

        xhr = $.ajax({
            url: detect_uri,
            dataType: 'jsonp',
            complete: function(o, e) {
                if (o.status == 200) {
                    // if the resource was successfully retrieved, that's all we care about
                    onSuccess();
                } else {
                    xhr = null;
                    if (NetworkTables.isRobotConnected()) {
                        onError();
                    }
                }
            }
        });
        
        tid = setTimeout(tryConnect, args.timeout);
    }
    
    function onRobotConnection(connected) {
        if (connected) {
            tryConnect();
        } else {
            onWaiting();

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
    
    onWaiting();
    NetworkTables.addRobotConnectionListener(onRobotConnection, true);
}
