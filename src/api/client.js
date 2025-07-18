import axios from 'axios';

// Determine the base URL based on environment
const getBaseURL = () => {
  console.log('🌍 Environment Detection:');
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
  
  if (process.env.NODE_ENV === 'production') {
    const url = process.env.REACT_APP_BACKEND_URL || 'https://social-todo-2bfe3f41e8ff.herokuapp.com/api';
    console.log('  Using PRODUCTION URL:', url);
    return url;
  } else {
    const url = process.env.REACT_APP_BACKEND_URL || 'http://social-todo-list.test/api';
    console.log('  Using DEVELOPMENT URL:', url);
    return url;
  }
};

const client = axios.create({
  baseURL: getBaseURL(),
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