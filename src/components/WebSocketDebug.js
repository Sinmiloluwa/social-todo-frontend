import { useEffect, useState } from 'react';
import { echo } from '../sockets/echo';

const WebSocketDebug = ({ listId }) => {
  const [events, setEvents] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('unknown');
  const [authToken, setAuthToken] = useState('');

  useEffect(() => {
    // Check auth token
    const token = localStorage.getItem('token');
    setAuthToken(token ? `${token.substring(0, 10)}...` : 'No token');

    // Monitor connection states only if echo and pusher are available
    if (echo && echo.connector && echo.connector.pusher) {
      const pusher = echo.connector.pusher;
      
      pusher.connection.bind('connected', () => {
        setIsConnected(true);
        setConnectionState('connected');
      });
      
      pusher.connection.bind('connecting', () => {
        setIsConnected(false);
        setConnectionState('connecting');
      });
      
      pusher.connection.bind('disconnected', () => {
        setIsConnected(false);
        setConnectionState('disconnected');
      });
      
      pusher.connection.bind('unavailable', () => {
        setIsConnected(false);
        setConnectionState('unavailable');
      });
      
      pusher.connection.bind('failed', () => {
        setIsConnected(false);
        setConnectionState('failed');
      });

      // Set initial state
      setConnectionState(pusher.connection.state);
      setIsConnected(pusher.connection.state === 'connected');
    } else {
      setConnectionState('WebSocket not available');
      setIsConnected(false);
    }

    if (!listId) return;

    const channel = echo.private(`todolist.${listId}`);
    
    // Listen to all item events and log them
    channel.listen('.item.created', (event) => {
      setEvents(prev => [...prev, { type: 'created', data: event, time: new Date().toLocaleTimeString() }]);
    });
    
    channel.listen('.item.updated', (event) => {
      setEvents(prev => [...prev, { type: 'updated', data: event, time: new Date().toLocaleTimeString() }]);
    });
    
    channel.listen('.item.completed', (event) => {
      setEvents(prev => [...prev, { type: 'completed', data: event, time: new Date().toLocaleTimeString() }]);
    });
    
    channel.listen('.item.deleted', (event) => {
      setEvents(prev => [...prev, { type: 'deleted', data: event, time: new Date().toLocaleTimeString() }]);
    });

    return () => {
      if (channel) {
        channel.stopListening('.item.created');
        channel.stopListening('.item.updated');
        channel.stopListening('.item.completed');
        channel.stopListening('.item.deleted');
      }
    };
  }, [listId]);

  const testConnection = () => {
    if (echo && echo.connector && echo.connector.pusher) {
      echo.connector.pusher.connect();
      setEvents(prev => [...prev, { 
        type: 'debug', 
        data: { message: 'Manual connection attempt' }, 
        time: new Date().toLocaleTimeString() 
      }]);
    } else {
      setEvents(prev => [...prev, { 
        type: 'debug', 
        data: { message: 'WebSocket not available - cannot test connection' }, 
        time: new Date().toLocaleTimeString() 
      }]);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      background: '#f8f9fa', 
      border: '1px solid #dee2e6',
      borderRadius: '5px',
      padding: '10px',
      width: '350px',
      maxHeight: '500px',
      overflow: 'auto',
      fontSize: '12px',
      zIndex: 1000
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>WebSocket Debug</h4>
      
      <div style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#fff', borderRadius: '3px' }}>
        <p style={{ margin: '2px 0' }}>
          <strong>Status:</strong> <span style={{ color: isConnected ? 'green' : 'red' }}>
            {connectionState}
          </span>
        </p>
        <p style={{ margin: '2px 0' }}>
          <strong>Channel:</strong> todolist.{listId}
        </p>
        <p style={{ margin: '2px 0' }}>
          <strong>Token:</strong> {authToken}
        </p>
        <p style={{ margin: '2px 0' }}>
          <strong>Auth Endpoint:</strong> /api/broadcasting/auth
        </p>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={testConnection}
          style={{ 
            padding: '5px 10px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '12px',
            marginRight: '5px'
          }}
        >
          Test Connection
        </button>
        <button 
          onClick={() => setEvents([])}
          style={{ 
            padding: '5px 10px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Clear Events
        </button>
      </div>
      
      <div style={{ maxHeight: '250px', overflow: 'auto' }}>
        <h5 style={{ margin: '10px 0 5px 0' }}>Recent Events:</h5>
        {events.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No events received yet</p>
        ) : (
          events.slice(-10).reverse().map((event, index) => (
            <div key={index} style={{ 
              marginBottom: '5px', 
              padding: '5px', 
              backgroundColor: '#fff', 
              border: '1px solid #e9ecef',
              borderRadius: '3px'
            }}>
              <strong>{event.type}</strong> at {event.time}
              <pre style={{ fontSize: '10px', margin: '2px 0 0 0', overflow: 'hidden' }}>
                {JSON.stringify(event.data, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>

      {!isConnected && (
        <div style={{ 
          marginTop: '10px', 
          padding: '5px', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7',
          borderRadius: '3px'
        }}>
          <strong>Troubleshooting:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '11px' }}>
            <li>Check if Laravel WebSocket server is running</li>
            <li>Verify Pusher credentials in .env</li>
            <li>Ensure broadcasting is configured in Laravel</li>
            <li>Check browser console for errors</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default WebSocketDebug;
