import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isLoading: boolean;
  login: (login: string, pass: string) => Promise<void>;
  activateAccount: (data: {
    role: 'STUDENT' | 'TEACHER';
    idNumber: string;
    initialPassword: string;
    newPassword: string;
    phone?: string;
  }) => Promise<any>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('apex_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (!localStorage.getItem('apex_token')) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
    } catch (err) {
      console.warn('Session verification failed, clearing credentials:', err);
      localStorage.removeItem('apex_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial load: verify token if stored
    const init = async () => {
      const stored = localStorage.getItem('apex_token');
      if (stored) {
        await refreshUser();
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async (loginId: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ login: loginId, password: pass });
      localStorage.setItem('apex_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const activateAccount = async (data: {
    role: 'STUDENT' | 'TEACHER';
    idNumber: string;
    initialPassword: string;
    newPassword: string;
    phone?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.activateAccount(data);
      localStorage.setItem('apex_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('apex_token');
    setToken(null);
    setUser(null);
  };

  const switchRole = async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      const res = await api.demoSwitch(targetRole);
      localStorage.setItem('apex_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } catch (error) {
      console.error('Failed to switch role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        token,
        isLoading,
        login,
        activateAccount,
        logout,
        switchRole,
        refreshUser,
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
