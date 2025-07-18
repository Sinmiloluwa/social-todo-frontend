import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

export const echo = new Echo({
  broadcaster: 'pusher',
  key: process.env.REACT_APP_PUSHER_KEY || '45d2b49aa337f102cfe1',
  cluster: process.env.REACT_APP_PUSHER_CLUSTER || 'eu',
  forceTLS: false,
  encrypted: true,
  wsHost: window.location.hostname,
  wsPort: 6001,
  disableStats: true,
  authEndpoint: 'http://localhost:8000/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  },
});