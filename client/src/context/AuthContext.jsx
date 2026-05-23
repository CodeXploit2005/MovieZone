import { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';
import { useTranslation } from 'react-i18next';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
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

  const login = async (userData) => {
    try {
      const data = await authService.login(userData.email, userData.password);
      setUser(data);
      localStorage.setItem('moviezone_user', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      setUser(data);
      localStorage.setItem('moviezone_user', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('moviezone_user');
  };

  const updateProfile = async (userData) => {
    try {
      const data = await authService.updateProfile(user.token, userData);
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('moviezone_user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Update failed',
      };
    }
  };

  const uploadAvatar = async (formData) => {
    try {
      const data = await authService.uploadAvatar(user.token, formData);
      const updatedUser = { ...user, avatar: data.avatar };
      setUser(updatedUser);
      localStorage.setItem('moviezone_user', JSON.stringify(updatedUser));
      return { success: true, avatar: data.avatar };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Upload failed',
      };
    }
  };

  const requestAdmin = async () => {
    try {
      const data = await authService.requestAdmin(user.token);
      const updatedUser = { ...user, adminRequestStatus: 'pending' };
      setUser(updatedUser);
      localStorage.setItem('moviezone_user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Request failed',
      };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, login, register, logout, 
      theme, toggleTheme, updateProfile, uploadAvatar, 
      requestAdmin, lang, toggleLang, t,
      isModalOpen, setIsModalOpen 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
