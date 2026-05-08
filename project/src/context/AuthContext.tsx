import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';
import type { User } from '../lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string, address?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('dinedrop_user');
    const token = localStorage.getItem('dinedrop_token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('dinedrop_user');
        localStorage.removeItem('dinedrop_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (!data.success) throw new Error(data.message || 'Login failed');
    localStorage.setItem('dinedrop_token', data.data.token);
    setUser(data.data.user);
    localStorage.setItem('dinedrop_user', JSON.stringify(data.data.user));
  };

  const register = async (name: string, email: string, password: string, phone?: string, address?: string) => {
    const { data } = await api.post('/auth/register', { name, email, password, phone, address });
    if (!data.success) throw new Error(data.message || 'Registration failed');
    localStorage.setItem('dinedrop_token', data.data.token);
    setUser(data.data.user);
    localStorage.setItem('dinedrop_user', JSON.stringify(data.data.user));
  };

  const logout = () => {
    localStorage.removeItem('dinedrop_token');
    localStorage.removeItem('dinedrop_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
