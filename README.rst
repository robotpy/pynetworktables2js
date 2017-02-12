pynetworktables2js
==================

A cross platform library that forwards NetworkTables key/values over a Websocket,
so that you can easily write a Driver Station Dashboard for your robot in HTML5 +
JavaScript.

This library does not provide a full dashboard solution, but is intended to
provide the necessary plumbing for one to create one with only knowledge
of HTML/Javascript. Because the communications layer uses NetworkTables, you
can connect to all FRC languages (C++, Java, LabVIEW, Python).

.. note:: NetworkTables is a protocol used for robot communication in the
          FIRST Robotics Competition, and can be used to talk to
          SmartDashboard/SFX. It does not have any security, and should never
          be used on untrusted networks.

Documentation
=============

Documentation can be found at http://pynetworktables2js.readthedocs.org/

Installation
============

Easy install (Windows only)
---------------------------

1. Download the latest pynetworktables2js.exe from github at
   https://github.com/robotpy/pynetworktables2js/releases .
2. Extract the exe from the zipfile, and copy it to your directory of HTML/JS
   files.
3. Double click the exe to run it!

.. note:: By default, it will connect to 127.0.0.1. To connect to a robot,
          you will need to pass the exe arguments to tell it where the robot is.
          Use --help to see the available options.

Manual install
--------------

Make sure to install python 2 or 3 on your computer, and on Windows you can
execute::

    py -m pip install pynetworktables2js
    
On Linux/OSX you can execute::

    pip install pynetworktables2js

.. note:: Technically, there's nothing stopping you from installing this on
          your robot, as there is a python interpreter available on the 
          roboRIO (RobotPy). However, due to FRC bandwidth limitations,
          it's probably best to run the UI + server on your driver station
          laptop.

Why make an HTML/Javascript dashboard?
======================================

**TL;DR**: It's simpler.

pynetworktables2js lowers the barrier of entry for teams that want an
additional way to tune/control their robot with a minimal amount of
programming.

Lots of students and mentors know how to create simple web pages to display
content, and there's lots of resources out there for creating dynamic content
for webpages that use javascript. There is a lot of visually appealing
content that others have created using web technologies -- why not leverage
those resources to make something cool to control your robot?

Usage
=====

You can just distribute your HTML files, and run a pynetworktables server
using the following command from inside the directory::

    python -m pynetworktables2js
	
Or on Windows::

    py -m pynetworktables2js
    
This will start a pynetworktables2js server using Tornado (which is installed
by default) and it will serve the current directory. You can navigate your
browser (I recommend Chrome) to http://127.0.0.1:8888 and see your website.


Customized python server
------------------------

There are two example servers distributed with pynetworktables2js, one that
uses `tornado <http://www.tornadoweb.org/en/stable/>`_, and one that uses
`aiohttp <https://github.com/KeepSafe/aiohttp>`_. Either one should work.

Go to the 'example' directory distributed with pynetworktables2js, and run::

    python tornado_server.py --robot 127.0.0.1

If you want to try this out with your current robot, you can do::

    python tornado_server.py --robot roborio-XXX.local
    
If you are running pynetworktables2js on your driver station laptop, you can
receive robot IP information directly from the Driver Station (handy during
actual competitions):

	python tornado_server.py --dashboard

If you navigate your browser (I recommend Chrome) to http://127.0.0.1:8888, all
of the current NetworkTables values will be shown as they change.

One way of testing this out is use FIRST's TableViewer application (you can
launch it using the "Outline Viewer" WPILib menu item in Eclipse), and start
it in server mode.

Feel free to copy the example directory to create your own customized
dashboard. Just add your custom files to the www directory.

Contributing new changes
========================

pynetworktables2js is intended to be a project that all members of the FIRST
community can quickly and easily contribute to. If you find a bug, or have an
idea that you think others can use:

1. `Fork this git repository <https://github.com/robotpy/pynetworktables2js/fork>`_ to your github account
2. Create your feature branch (``git checkout -b my-new-feature``)
3. Commit your changes (``git commit -am 'Add some feature'``)
4. Push to the branch (``git push -u origin my-new-feature``)
5. Create new Pull Request on github

One place in particular I would love to see contributions is in adding useful
javascript functions/objects that make creating dashboards even easier!

Authors
=======

Leon Tan of FRC Team 1418 did the initial research/work to get this working,
and created an initial working prototype for Team 1418's 2015 Dashboard, which
was instrumental to winning an Innovation In Control award at the 2015 Greater
DC Regional.

Dustin Spicuzza cleaned stuff up, rewrote things, added more functionality,
wrote documentation, and packaged it so other teams could use it.
