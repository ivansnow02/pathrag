import { getToken } from './auth';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.listeners = new Map();
    this.documentListeners = new Map();
  }

  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    // For development, use a dummy token if none is available
    let token = getToken();
    if (!token) {
      console.warn('No authentication token available, using dummy token for development');
      token = 'dummy-token-for-development';
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/documents/ws/status?token=${token}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Notify global listeners
          this.notifyListeners('message', data);

          // Notify document-specific listeners if this update is for a document
          if (data.document_id) {
            this.notifyDocumentListeners(data.document_id, data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        this.isConnected = false;
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && event.code !== 1001) {
          this.attemptReconnect();
        }

        this.notifyListeners('close', event);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifyListeners('error', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Maximum reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.socket && this.isConnected) {
      this.socket.close(1000, 'User disconnected');
      this.isConnected = false;
    }

    clearTimeout(this.reconnectTimeout);
  }

  // Send a message to the server
  send(message) {
    if (!this.isConnected) {
      console.error('Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket.send(messageString);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  // Request status for a specific document
  requestDocumentStatus(documentId) {
    return this.send({
      type: 'get_status',
      document_id: documentId
    });
  }

  // Add a global event listener
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => this.removeEventListener(event, callback);
  }

  // Remove a global event listener
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  // Notify all listeners for an event
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket ${event} listener:`, error);
        }
      });
    }
  }

  // Add a document-specific listener
  addDocumentListener(documentId, callback) {
    const id = String(documentId);
    if (!this.documentListeners.has(id)) {
      this.documentListeners.set(id, new Set());
    }
    this.documentListeners.get(id).add(callback);

    return () => this.removeDocumentListener(id, callback);
  }

  // Remove a document-specific listener
  removeDocumentListener(documentId, callback) {
    const id = String(documentId);
    if (this.documentListeners.has(id)) {
      this.documentListeners.get(id).delete(callback);
    }
  }

  // Notify document-specific listeners
  notifyDocumentListeners(documentId, data) {
    const id = String(documentId);
    if (this.documentListeners.has(id)) {
      this.documentListeners.get(id).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in document ${id} WebSocket listener:`, error);
        }
      });
    }
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

export default websocketService;
