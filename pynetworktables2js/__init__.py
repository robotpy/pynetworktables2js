import logging
logger = logging.getLogger('net2js')

try:
    import tornado
except ImportError as e:
    logger.info(e)
    logger.info("Could not import tornado, disabling support.")
else:
    from .tornado_handlers import NetworkTablesWebSocket, NonCachingStaticFileHandler, get_handlers

try:
    import aiohttp
except ImportError as e:
    logger.info(e)
    logger.info("Could not import aiohttp, disabling support.")
else:
    from .aiohttp_handlers import networktables_websocket, nt2js_static_resources

try:
    from .version import __version__
except ImportError:
    __version__ = '__master__'
