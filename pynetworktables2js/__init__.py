
from .handlers import NetworkTablesWebSocket, NonCachingStaticFileHandler, get_handlers

try:
    from .version import __version__
except ImportError:
    __version__ = '__master__'
