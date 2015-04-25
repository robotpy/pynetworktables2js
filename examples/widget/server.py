#!/usr/bin/env python
'''
    This is an example server application that you can use to connect your
    HTML/Javascript dashboard code to your robot via NetworkTables.

    Run this application with python, then you can open your browser to 
    http://localhost:8888/ to view the index.html page.
'''

from os.path import abspath, dirname, exists, join
from optparse import OptionParser

import tornado.web
from tornado.ioloop import IOLoop

from networktables import NetworkTable
from pynetworktables2js import get_handlers, NonCachingStaticFileHandler

import logging
logger = logging.getLogger('dashboard')

log_datefmt = "%H:%M:%S"
log_format = "%(asctime)s:%(msecs)03d %(levelname)-8s: %(name)-20s: %(message)s"

def init_networktables(ipaddr):

    logger.info("Connecting to networktables at %s" % ipaddr)
    NetworkTable.setIPAddress(ipaddr)
    NetworkTable.setClientMode()
    NetworkTable.initialize()
    logger.info("Networktables Initialized")


if __name__ == '__main__':

    # Setup options here
    parser = OptionParser()
    
    parser.add_option('-p', '--port', default=8888, 
                      help='Port to run web server on')
    
    parser.add_option('-v', '--verbose', default=False, action='store_true', 
                      help='Enable verbose logging')
    
    parser.add_option('--robot', default='127.0.0.1', 
                      help="Robot's IP address")
    
    options, args = parser.parse_args()
    
    # Setup logging
    logging.basicConfig(datefmt=log_datefmt,
                        format=log_format,
                        level=logging.DEBUG if options.verbose else logging.INFO)
    
    # Setup NetworkTables
    init_networktables(options.robot)
    
    # setup tornado application with static handler + networktables support
    www_dir = abspath(join(dirname(__file__), 'www'))
    index_html = join(www_dir, 'index.html')

    if not exists(www_dir):
        logger.error("Directory '%s' does not exist!" % www_dir)
        exit(1)

    if not exists(index_html):
        logger.warn("%s not found" % index_html)
    
    app = tornado.web.Application(
        get_handlers() + [
            (r"/()", NonCachingStaticFileHandler, {"path": index_html}),
            (r"/(.*)", NonCachingStaticFileHandler, {"path": www_dir})
        ]
    )
    
    # Start the app
    logger.info("Listening on http://localhost:%s/" % options.port)

    app.listen(options.port)
    IOLoop.current().start()
