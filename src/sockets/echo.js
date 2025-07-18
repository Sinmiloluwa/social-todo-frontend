import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Create a mock echo object that won't crash the app
const createMockEcho = () => ({
  private: (channel) => ({
    listen: (event, callback) => {
      console.warn(`WebSocket not available: would listen to ${event} on ${channel}`);
      return { stopListening: () => {} };
    },
    stopListening: () => {}
  }),
  connector: null
});

// Try to create real echo, fall back to mock on failure
let echo;

try {
  // Real WebSocket configuration
  echo = new Echo({
    broadcaster: 'pusher',
    key: process.env.REACT_APP_PUSHER_KEY || '45d2b49aa337f102cfe1',
    cluster: process.env.REACT_APP_PUSHER_CLUSTER || 'eu',
    forceTLS: false,
    encrypted: false,
    authEndpoint: `${process.env.REACT_APP_BACKEND_URL || 'http://social-todo-list.test'}/api/broadcasting/auth`,
    auth: {
      headers: getAuthHeaders(),
    },
  });
  
  // Add connection debugging
  if (echo.connector && echo.connector.pusher) {
    const pusher = echo.connector.pusher;
    
    pusher.connection.bind('connected', () => {
      console.log('✅ Pusher connected successfully');
    });
    
    pusher.connection.bind('error', (error) => {
      console.error('❌ Pusher connection error:', error);
    });
    
    pusher.connection.bind('disconnected', () => {
      console.warn('⚠️ Pusher disconnected');
    });
    
    pusher.connection.bind('connecting', () => {
      console.log('🔄 Pusher connecting...');
    });
    
    pusher.connection.bind('unavailable', () => {
      console.warn('⚠️ Pusher unavailable');
    });
    
    pusher.connection.bind('failed', () => {
      console.error('❌ Pusher connection failed');
    });
    
    // Log all events for debugging
    pusher.bind_global((eventName, data) => {
      console.log('🔔 Global Pusher event:', eventName, data);
    });
  }
  
  console.log('Echo WebSocket initialized successfully');
  
} catch (error) {
  console.warn('Failed to initialize Echo WebSocket, using mock:', error);
  echo = createMockEcho();
}

export { echo };

export const updateEchoAuth = () => {
  try {
    if (echo && echo.options && echo.options.auth) {
      echo.options.auth.headers = getAuthHeaders();
    }
  } catch (error) {
    console.warn('Failed to update echo auth headers:', error);
  }
};