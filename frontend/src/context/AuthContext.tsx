import React, { createContext, useContext, useState, useEffect } from 'react';

export const API_BASE_URL = 'https://ecom-ml-backend.onrender.com';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  status: 'active' | 'inactive';
  sponsor_id: number | null;
  parent_id: number | null;
  position: 'left' | 'right' | null;
  left_child_id: number | null;
  right_child_id: number | null;
  personal_sw: number;
  left_leg_sw: number;
  right_leg_sw: number;
  total_left_sw: number;
  total_right_sw: number;
  wallet_balance: number;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (
    username: string,
    email: string,
    password: string,
    fullName: string,
    sponsorUsername: string,
    position: 'left' | 'right'
  ) => Promise<User>;
  refreshUser: () => Promise<User | null>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('mlm_token'));
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (authToken: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return userData;
      } else {
        // Token is invalid/expired
        logout();
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        await fetchUserProfile(token);
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('mlm_token', data.access_token);
      setToken(data.access_token);
      await fetchUserProfile(data.access_token);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('mlm_token');
    setToken(null);
    setUser(null);
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    fullName: string,
    sponsorUsername: string,
    position: 'left' | 'right'
  ): Promise<User> => {
    const payload = {
      username,
      email,
      password,
      full_name: fullName,
      sponsor_username: sponsorUsername || null,
      position,
    };

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Registration failed');
    }

    return response.json();
  };

  const refreshUser = async (): Promise<User | null> => {
    if (!token) return null;
    return fetchUserProfile(token);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
