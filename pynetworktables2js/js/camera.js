"use strict";

if ($ === undefined) {
    alert("jQuery must be downloaded+included to use camera.js!");
}


// creates svg element
function $s(elem) {
    return $(document.createElementNS('http://www.w3.org/2000/svg', elem));
}


/**
    This useful helper function will create an img or svg element inside of the
    div element that you specify. The image will only be connected when a
    successful NetworkTables connection is detected, to prevent timeout issues.
    Additionally, this function will attempt to verify that the webcam server is
    actually up and running before creating the image.
    
    If the NetworkTables key /robot/is_simulation is true, this will show an svg
    with the text 'simulated camera'.
    
    You should provide an object with an object that can have the following 
    attributes:
    
    :param container:   Where to draw things
    :param proto:       optional, defaults to http://
    :param host:        optional, if null will use robot's autodetected IP
    :param port:        optional, webserver port
    :param image_url:   path to mjpg stream
    :param data_url:    a file or page that must exist on the webcam server
    :param wait_img:    optional image to show when not connected
    :param error_img:   optional image to show when not connected
    :param attrs:       optional attributes to set on svg or img element
    :param nosim:       if true, connect to the webcam in simulation mode
    
    For example, to connect to mjpg-streamer on the RoboRIO:
    
    .. code-block:: javascript
    
        loadCameraOnConnect({
            container: '#my_div_element',
            port: 5800,
            image_url: '/?action=stream',
            data_url: '/program.json',
            attrs: {
                width: 640,
                height: 480
            }
        });
    
    
    .. note:: This has only been tested with mjpg-streamer, but should work for 
              other HTTP webcams as well.
*/
function loadCameraOnConnect(args) {
    /* 
        problem: if you load the image before connecting to the robot, it may
        never connect, and image loads aren't cancelable. Instead, wait for
        NetworkTables to connect, and then try to load a data file from the
        camera server. If that succeeds, then we load the image.
        
        It's a bit complicated, but it should work reasonably well..
    */
    
    var dbg = 'loadCameraOnConnect (' + args.container + '): ';
    
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
    
    function onSimulated() {
        console.log(dbg + "simulating camera");
        // TODO: better simulation
        
        errors = 0;
        var e = set_svg();
        e.append($s('text').attr({x: cx, y: cy, fill: 'white'})
                            .text('Simulated camera'));
    }
    
    function onSuccess() {
        var webcam_url = create_remote_uri(args.image_url);
        errors = 0;
        clearTimeout(tid);
        tid = null;
        xhr = null;

        console.log(dbg + "successfully connected to server, loading webcam at " + webcam_url);
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
            console.log(dbg + "Detecting webcam server via connection to " + detect_uri);
        
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
    
    onWaiting();
    NetworkTables.addRobotConnectionListener(function (connected) {
        if (connected) {
            
            if (NetworkTables.getValue('/robot/is_simulation') && !args.nosim) {
                onSimulated();
            } else {
                tryConnect();
            }
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
    }, true);
}
