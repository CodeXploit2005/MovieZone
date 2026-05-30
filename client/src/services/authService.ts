/// <reference types="vite/client" />
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/auth`;

export interface LoginResponse {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin';
  token: string;
  adminRequestStatus: 'none' | 'pending' | 'approved' | 'rejected';
}

const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await axios.post(`${API_URL}/login`, { email, password });
    return res.data;
  },
  
  register: async (userData: any): Promise<LoginResponse> => {
    const res = await axios.post(`${API_URL}/register`, userData);
    return res.data;
  },
  
  checkEmail: async (email: string) => {
    const res = await axios.post(`${API_URL}/check-email`, { email });
    return res.data;
  },
  
  resetPassword: async (email: string, newPassword: string) => {
    const res = await axios.post(`${API_URL}/reset-password`, { email, newPassword });
    return res.data;
  },
  
  getProfile: async (token: string) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.get(`${API_URL}/profile`, config);
    return res.data;
  },
  
  updateProfile: async (token: string, userData: any) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.put(`${API_URL}/profile`, userData, config);
    return res.data;
  },

  getStats: async (token: string) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.get(`${API_URL}/stats`, config);
    return res.data;
  },
  
  uploadAvatar: async (token: string, formData: FormData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    };
    const res = await axios.post(`${API_URL}/upload-avatar`, formData, config);
    return res.data;
  },

  requestAdmin: async (token: string) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.post(`${API_URL}/request-admin`, {}, config);
    return res.data;
  }
};

export default authService;
