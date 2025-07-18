import axios from 'axios';

const client = axios.create({
  baseURL: 'http://social-todo-list.test/api',
  withCredentials: true,
});

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Ensure headers object exists
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag to prevent redirect loops
let isRedirecting = false;

// Response interceptor to handle 401 errors globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      localStorage.removeItem('token');
      
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        isRedirecting = true;
        window.location.href = '/login';
        
        setTimeout(() => {
          isRedirecting = false;
        }, 1000);
      }
    }
    return Promise.reject(error);
  }
);

export default client;