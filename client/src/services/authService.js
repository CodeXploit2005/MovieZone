import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/auth`;

const authService = {
  login: async (email, password) => {
    const res = await axios.post(`${API_URL}/login`, { email, password });
    return res.data;
  },
  
  register: async (userData) => {
    const res = await axios.post(`${API_URL}/register`, userData);
    return res.data;
  },
  
  checkEmail: async (email) => {
    const res = await axios.post(`${API_URL}/check-email`, { email });
    return res.data;
  },
  
  resetPassword: async (email, newPassword) => {
    const res = await axios.post(`${API_URL}/reset-password`, { email, newPassword });
    return res.data;
  },
  
  getProfile: async (token) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.get(`${API_URL}/profile`, config);
    return res.data;
  },
  
  updateProfile: async (token, userData) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.put(`${API_URL}/profile`, userData, config);
    return res.data;
  },

  getStats: async (token) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.get(`${API_URL}/stats`, config);
    return res.data;
  },
  
  uploadAvatar: async (token, formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    };
    const res = await axios.post(`${API_URL}/upload-avatar`, formData, config);
    return res.data;
  },

  requestAdmin: async (token) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.post(`${API_URL}/request-admin`, {}, config);
    return res.data;
  }
};

export default authService;