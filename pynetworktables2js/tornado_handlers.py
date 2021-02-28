from os.path import abspath, dirname, join

from tornado.ioloop import IOLoop
from tornado.web import StaticFileHandler
from tornado.websocket import WebSocketHandler, WebSocketClosedError

from .nt_serial import NTSerial

import logging

logger = logging.getLogger("net2js")

__all__ = ["get_handlers", "NetworkTablesWebSocket", "NonCachingStaticFileHandler"]


class NetworkTablesWebSocket(WebSocketHandler):
    """
    A tornado web handler that forwards values between NetworkTables
    and a webpage via a websocket
    """

    ntserial = None

    def open(self):
        logger.info("NetworkTables websocket opened")
        self.ioloop = IOLoop.current()
        self.ntserial = NTSerial(self.send_msg_threadsafe)

    def check_origin(self, origin):
        """
        Allow CORS requests
        """
        return True

    def on_message(self, message):
        if self.ntserial is not None:
            self.ntserial.process_update(message)

    def send_msg(self, msg):
        try:
            self.write_message(msg, binary=True)
        except WebSocketClosedError:
            logger.warning("websocket closed when sending message")

    def send_msg_threadsafe(self, data):
        self.ioloop.add_callback(self.send_msg, data)

    def on_close(self):
        logger.info("NetworkTables websocket closed")
        if self.ntserial is not None:
            self.ntserial.close()


class NonCachingStaticFileHandler(StaticFileHandler):
    """
    This static file handler disables caching, to allow for easy
    development of your Dashboard
    """

    # This is broken in tornado, disable it
    def check_etag_header(self):
        return False

    def set_extra_headers(self, path):
        # Disable caching
        self.set_header(
            "Cache-Control", "no-store, no-cache, must-revalidate, max-age=0"
        )


def get_handlers():
    """
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
    """

    js_path_opts = {"path": abspath(join(dirname(__file__), "js"))}

    return [
        ("/networktables/ws", NetworkTablesWebSocket),
        ("/networktables/(.*)", NonCachingStaticFileHandler, js_path_opts),
    ]
