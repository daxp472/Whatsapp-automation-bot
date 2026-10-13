import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [quota, setQuota] = useState({
    messageQuota: 100,
    messagesUsed: 0,
    remaining: 100
  });
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await api.auth.getMe();
      if (res.success && res.data) {
        setUser(res.data.user);
        setWorkspace(res.data.workspace);
        if (res.data.quota) {
          setQuota(res.data.quota);
        }
      }
    } catch {
      setUser(null);
      setWorkspace(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('replypilot_token');
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    if (res.success && res.data?.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      setWorkspace(res.data.workspace);
      await refreshUser();
      return res.data;
    }
    throw new Error(res.error?.message || 'Login failed');
  };

  const signup = async (userData) => {
    const res = await api.auth.signup(userData);
    if (res.success && res.data?.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      setWorkspace(res.data.workspace);
      await refreshUser();
      return res.data;
    }
    throw new Error(res.error?.message || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setWorkspace(null);
  };

  return (
    <AuthContext.Provider value={{ user, workspace, quota, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
