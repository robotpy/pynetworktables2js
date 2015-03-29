
from os.path import abspath, dirname, join

try:
    from ujson import loads
except ImportError:
    from json import loads


from tornado.ioloop import IOLoop
from tornado.web import StaticFileHandler
from tornado.websocket import WebSocketHandler, WebSocketClosedError


from networktables import NetworkTable

import logging
logger = logging.getLogger('net2js')

__all__ = ['get_handlers', 'NetworkTablesWebSocket', 'NonCachingStaticFileHandler']

class NetworkTablesWebSocket(WebSocketHandler):
    '''
        A tornado web handler that forwards values between NetworkTables
        and a webpage via a websocket
    '''
    
    def open(self):
        logger.info("NetworkTables websocket opened")

        self.ioloop = IOLoop.current()
        self.nt = NetworkTable.getGlobalTable()
        NetworkTable.addGlobalListener(self.on_nt_change, immediateNotify=True)
        self.nt.addConnectionListener(self, immediateNotify=True)

    def on_message(self, message):
        # called when message is received from the dashboard
        data = loads(message)
        self.nt.putValue(data['k'], data['v'])
   
    def on_close(self):
        logger.info("NetworkTables websocket closed")
        NetworkTable.removeGlobalListener(self.on_nt_change)
    
    def send_to_dashboard(self, msg):
        try:
            self.write_message(msg, False)
        except WebSocketClosedError:
            logger.warn("websocket closed when sending message")

    #
    # NetworkTables API
    #
    # These functions cannot directly access the websocket, as they are
    # called from another thread
    
    def on_nt_change(self, key, value, isNew):
        self.ioloop.add_callback(self.send_to_dashboard,
                                 {'k': key, 'v': value, 'n': isNew})
        
    def connected(self, table):
        self.ioloop.add_callback(self.send_to_dashboard,
                                 {'r': True})
    
    def disconnected(self, table):
        self.ioloop.add_callback(self.send_to_dashboard,
                                 {'r': False})


class NonCachingStaticFileHandler(StaticFileHandler):
    '''
        This static file handler disables caching, to allow for easy
        development of your Dashboard
    '''

    # This is broken in tornado, disable it
    def check_etag_header(self):
        return False
    
    def set_extra_headers(self, path):
        # Disable caching
        self.set_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')


def get_handlers():
    '''
        Returns a list that can be concatenated to the list of handlers
        passed to the ``tornado.web.Application`` object. This list contains
        handlers for the NetworkTables websocket and the necessary javascript
        to use it. 
                
        Example usage::
        
            import pynetworktables2js
            import tornado.web
            
            ... 
            
            app = tornado.web.Application(
                pynetworktables2js.get_handlers() + [
                    # tornado handlers here
                ])
    '''
    
    js_path_opts = {'path': abspath(join(dirname(__file__), 'js'))}

    return [
        ('/networktables/ws', NetworkTablesWebSocket),
        ('/networktables/(.*)', NonCachingStaticFileHandler, js_path_opts),
    ]

