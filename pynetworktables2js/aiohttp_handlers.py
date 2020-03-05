import asyncio
import logging
from functools import partial
from aiohttp import web
from os.path import abspath, dirname, join
from .nt_serial import NTSerial

logger = logging.getLogger("net2js")

__all__ = ["nt2js_static_resources", "networktables_websocket"]


def nt2js_static_resources():
    """
    Returns the absolute filesystem path for the nt2js static resources.
    """
    return abspath(join(dirname(__file__), "js"))


@asyncio.coroutine
def networktables_websocket(request):
    # Setup websocket
    ws = web.WebSocketResponse()
    ws.start(request)

    event_loop = asyncio.get_event_loop()

    def send_message(msg):
        # Schedule msg to be sent from the event loop's thread
        event_loop.call_soon_threadsafe(partial(ws.send_bytes, msg))

    # Setup nt_serial
    nt_serial = NTSerial(send_message)

    # Message listener loop
    try:
        while True:
            msg = yield from ws.receive_str()
            nt_serial.process_update(msg)
            if ws.closing:
                break
    except Exception as e:
        logger.error(e)
    finally:
        logger.info("NetworkTables Websocket Disconnected")
        return ws
