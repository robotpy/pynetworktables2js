JS API: Camera Integration
==========================

.. code-block:: html

    <script src="/networktables/camera.js"></script>
    
.. note:: These functions require `jQuery <http://jquery.com/>`_ to be
          loaded first!

.. js:function:: loadCameraOnConnect(args)

    This useful helper function will create an img or svg element inside of the
    div element that you specify. The image will only be connected when a
    successful NetworkTables connection is detected, to prevent timeout issues.
    Additionally, this function will attempt to verify that the webcam server is
    actually up and running before creating the image.

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
