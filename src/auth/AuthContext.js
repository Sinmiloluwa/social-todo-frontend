import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchUser = async () => {
    console.log('AuthContext: Fetching user...');
    try {
      const { data } = await client.get('/auth/user');
      console.log('AuthContext: User fetched successfully:', data);
      setUser(data);
      setIsAuthenticated(true);
    } catch (error) {
      console.log('AuthContext: Failed to fetch user:', error.response?.status);
      console.log('AuthContext: Error details:', error.response?.data);
      setUser(null);
      setIsAuthenticated(false);
      
      // Don't remove token here if it's a 401 - let the interceptor handle it
      if (error.response?.status !== 401) {
        localStorage.removeItem('token');
      }
    }
  };

  const login = (userData, token) => {
    console.log('AuthContext: login called with user:', userData, 'token:', token ? 'EXISTS' : 'MISSING');
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('token', token);
    console.log('AuthContext: login complete - user set, isAuthenticated:', true);
  };

  const logout = () => {
    console.log('AuthContext: logout called - clearing user and token');
    console.trace('AuthContext: logout call stack');
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const currentPath = window.location.pathname;
    
    console.log('AuthContext: useEffect triggered');
    console.log('AuthContext: token exists:', !!token);
    console.log('AuthContext: current path:', currentPath);
    console.log('AuthContext: current user state:', user);
    console.log('AuthContext: current isAuthenticated state:', isAuthenticated);
    
    if (token && !user && !currentPath.includes('/login') && !currentPath.includes('/register')) {
      console.log('AuthContext: Have token but no user data - setting authenticated state');
      setIsAuthenticated(true);
    }
    
    console.log('AuthContext: Skipping fetchUser - using login data only');
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      setUser, 
      fetchUser, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);