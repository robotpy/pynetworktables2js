try:
    import ujson as json
except ImportError:
    import json
from networktables import NetworkTable

__all__ = ["NTSerial"]


class NTSerial(object):
    """
    A utility class for synchronizing NetworkTables over a serial connection.
    """

    def __init__(self, update_callback):
        """
        :param update_callback: A callable with signature ```callable(update)``` for processing outgoing updates
        formatted as strings.
        """
        self.update_callback = update_callback
        self.nt = NetworkTable.getGlobalTable()
        NetworkTable.addGlobalListener(self._nt_on_change, immediateNotify=True)

        class Empty:
            pass
        self.conn_listener = Empty()
        self.conn_listener.connected = self._nt_connected
        self.conn_listener.disconnected = self._nt_disconnected

        self.nt.addConnectionListener(self.conn_listener, immediateNotify=True)

    def process_update(self, update):
        """Process an incoming update from a remote NetworkTables"""
        data = json.loads(update)
        self.nt.putValue(data['k'], data['v'])

    def _send_update(self, data):
        """Send a NetworkTables update via the stored send_update callback"""
        if isinstance(data, dict):
            data = json.dumps(data)
        self.update_callback(data)

    def _nt_on_change(self, key, value, isNew):
        """NetworkTables global listener callback"""
        self._send_update({'k': key, 'v': value, 'n': isNew})

    # NetworkTables connection listener callbacks
    def _nt_connected(self, table):
        self._send_update({'r': True, 'a': self.nt.getRemoteAddress()})

    def _nt_disconnected(self, table):
        self._send_update({'r': False, 'a': None})

    def close(self):
        """
        Clean up NetworkTables listeners
        """
        NetworkTable.removeGlobalListener(self._nt_on_change)
        self.nt.removeConnectionListener(self.conn_listener)