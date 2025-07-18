import { createContext, useContext, useEffect, useState } from 'react';
import { updateEchoAuth } from '../sockets/echo';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Update WebSocket authentication headers
    updateEchoAuth();
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const currentPath = window.location.pathname;
    
    if (token && !user && !currentPath.includes('/login') && !currentPath.includes('/register')) {
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [user, isAuthenticated]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      setUser, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);