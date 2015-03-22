pynetworktables2js
==================

A library that forwards NetworkTables key/values over a Websocket, so that
you can easily write your dashboard in HTML5 + JavaScript.

This library does not provide a full dashboard solution, but is intended to
provide the necessary plumbing for one to create one with only knowledge
of HTML/Javascript. Because the communication layer uses NetworkTables, you
can connect to all FRC languages (C++, Java, LabVIEW, Python).

Installation
============

Make sure to install python 2 or 3 on your computer, and on Windows you can
execute::

    py -m pip install pynetworktables2js
    
On Linux/OSX you can execute::

    pip install pynetworktables2js


Usage
=====

Go to the 'example' directory distributed with pynetworktables2js, and run::

	python server.py --robot 127.0.0.1

If you navigate your browser (I recommend Chrome) to http://127.0.0.1:8888, all
of the current NetworkTables values will be shown as they change.

One way of testing this out is use the TableViewer application, and start it in
server mode.

Feel free to copy the example directory to create your own customized
dashboard. Just add your custom files to the www directory.

Authors
=======

Leon Tan of FRC Team 1418 did the initial research/work to get this working,
and created an initial working prototype for Team 1418's 2015 Dashboard.

Dustin Spicuzza cleaned stuff up, rewrote things, added more functionality,
and packaged it so other teams could use it.
