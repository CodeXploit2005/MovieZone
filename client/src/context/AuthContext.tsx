import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import authService from '../services/authService';
import { useTranslation } from 'react-i18next';

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin';
  token: string;
  adminRequestStatus?: 'none' | 'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  theme: string;
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  toggleTheme: () => void;
  toggleLang: () => void;
  login: (userData: any) => Promise<{ success: boolean; message?: string }>;
  register: (userData: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (userData: any) => Promise<{ success: boolean; message?: string }>;
  uploadAvatar: (formData: FormData) => Promise<{ success: boolean; message?: string; avatar?: string }>;
  requestAdmin: () => Promise<{ success: boolean; message?: string }>;
  lang: string;
  t: any;
  formatMsg: (msg: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('moviezone_theme') || 'dark');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('moviezone_user');
      if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error initializing user from storage:', error);
      localStorage.removeItem('moviezone_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('moviezone_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleLang = () => {
    const nextLang = lang === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  const formatMsg = (msg: string): string => {
    if (!msg || typeof msg !== 'string') return msg;
    if (msg.includes(' / ')) {
      const parts = msg.split(' / ');
      return lang === 'vi' ? parts[0] : parts[1];
    }
    return msg;
  };

  const login = async (userData: any) => {
    try {
      const data = await authService.login(userData.email, userData.password);
      setUser(data);
      localStorage.setItem('moviezone_user', JSON.stringify(data));
      return { success: true };
    } catch (error: any) {
      return { success: false, message: formatMsg(error.response?.data?.message || 'Login failed') };
    }
  };

  const register = async (userData: any) => {
    try {
      const data = await authService.register(userData);
      setUser(data);
      localStorage.setItem('moviezone_user', JSON.stringify(data));
      return { success: true };
    } catch (error: any) {
      return { success: false, message: formatMsg(error.response?.data?.message || 'Registration failed') };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('moviezone_user');
  };

  const updateProfile = async (userData: any) => {
    try {
      if (!user) throw new Error('Not authenticated');
      const data = await authService.updateProfile(user.token, userData);
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('moviezone_user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: formatMsg(error.response?.data?.message || 'Update failed'),
      };
    }
  };

  const uploadAvatar = async (formData: FormData) => {
    try {
      if (!user) throw new Error('Not authenticated');
      const data = await authService.uploadAvatar(user.token, formData);
      const updatedUser = { ...user, avatar: data.avatar };
      setUser(updatedUser);
      localStorage.setItem('moviezone_user', JSON.stringify(updatedUser));
      return { success: true, avatar: data.avatar };
    } catch (error: any) {
      return {
        success: false,
        message: formatMsg(error.response?.data?.message || 'Upload failed'),
      };
    }
  };

  const requestAdmin = async () => {
    try {
      if (!user) throw new Error('Not authenticated');
      const response = await authService.requestAdmin(user.token);
      const updatedUser: User = { ...user, adminRequestStatus: 'pending' };
      setUser(updatedUser);
      localStorage.setItem('moviezone_user', JSON.stringify(updatedUser));
      return { success: true, message: formatMsg(response.message) };
    } catch (error: any) {
      return {
        success: false,
        message: formatMsg(error.response?.data?.message || 'Request failed'),
      };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, login, register, logout, 
      theme, toggleTheme, updateProfile, uploadAvatar, 
      requestAdmin, lang, toggleLang, t, formatMsg,
      isModalOpen, setIsModalOpen 
    }}>
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
