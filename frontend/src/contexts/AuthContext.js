import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getBackendUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      return process.env.REACT_APP_BACKEND_URL || window.location.origin;
    }
    return `http://localhost:${process.env.REACT_APP_PORT_BACKEND || 5050}`;
  };

  const checkAuth = async () => {
    try {
      const backendUrl = getBackendUrl();
      console.log('Checking auth status with backend URL:', backendUrl);
      
      const response = await axios.get(`${backendUrl}/api/auth/status`, {
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Auth status response:', response.data);
      
      if (response.data.isAuthenticated && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const backendUrl = getBackendUrl();
      const response = await axios.post(
        `${backendUrl}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      setUser(response.data);
      return response.data;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    try {
      const backendUrl = getBackendUrl();
      const response = await axios.post(
        `${backendUrl}/api/auth/register`,
        { name, email, password },
        { withCredentials: true }
      );
      setUser(response.data);
      return response.data;
    } catch (err) {
      console.error('Register error:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      const backendUrl = getBackendUrl();
      await axios.get(`${backendUrl}/api/auth/logout`, {
        withCredentials: true
      });
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 