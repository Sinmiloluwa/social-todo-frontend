import axios from 'axios';

const client = axios.create({
  baseURL: 'http://social-todo-list.test/api',
  withCredentials: true,
});

client.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Flag to prevent redirect loops
let isRedirecting = false;

// Response interceptor to handle 401 errors globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401 && !isRedirecting) {
      console.log('401 error detected, current path:', window.location.pathname);
      
      // Clear token
      localStorage.removeItem('token');
      
      // Only redirect if we're not already on login/register pages
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        console.log('Redirecting to login...');
        isRedirecting = true;
        window.location.href = '/login';
        
        // Reset flag after a delay
        setTimeout(() => {
          isRedirecting = false;
        }, 1000);
      }
    }
    return Promise.reject(error);
  }
);

export default client;