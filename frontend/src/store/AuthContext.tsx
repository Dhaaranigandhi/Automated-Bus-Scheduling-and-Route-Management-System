import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    const token = localStorage.getItem('transitflow_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await client.get('/auth/profile');
      if (res.data.success) {
        setUser(res.data.user);
      } else {
        localStorage.removeItem('transitflow_token');
        setUser(null);
      }
    } catch (err) {
      localStorage.removeItem('transitflow_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await client.post('/auth/login', { email, password });
      if (res.data.success && res.data.accessToken) {
        localStorage.setItem('transitflow_token', res.data.accessToken);
        setUser(res.data.user);
      }
    } catch (err: any) {
      throw new Error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (payload: any) => {
    try {
      await client.post('/auth/signup', payload);
    } catch (err: any) {
      throw new Error(err.message || 'Registration failed');
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await client.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed', err);
    } finally {
      localStorage.removeItem('transitflow_token');
      setUser(null);
      setIsLoading(false);
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    checkAuth();
    
    // Global listener for auth logouts (triggered by response interceptors)
    const handleLogout = () => {
      setUser(null);
      setIsLoading(false);
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
