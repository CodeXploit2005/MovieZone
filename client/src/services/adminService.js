import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/admin`;

const adminService = {
  getStats: async (token) => {
    const res = await axios.get(`${API_URL}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  
  getRequests: async (token) => {
    const res = await axios.get(`${API_URL}/requests`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  
  getComments: async (token) => {
    const res = await axios.get(`${API_URL}/comments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  
  getMovies: async (token) => {
    const res = await axios.get(`${API_URL}/movies`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  
  getBanners: async (token) => {
    const res = await axios.get(`${API_URL}/banners`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  
  approveRequest: async (token, userId, status) => {
    const res = await axios.patch(`${API_URL}/approve-request/${userId}`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  updateUserRole: async (token, userId, role) => {
    const res = await axios.patch(`${API_URL}/users/${userId}/role`, { role }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  
  deleteComment: async (token, commentId) => {
    const res = await axios.delete(`${API_URL}/comments/${commentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  deleteReply: async (token, commentId, replyId) => {
    const res = await axios.delete(`${API_URL}/comments/${commentId}/replies/${replyId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  updateReply: async (token, commentId, replyId, content) => {
    const res = await axios.put(`${API_URL}/comments/${commentId}/replies/${replyId}`, { content }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  updateComment: async (token, commentId, data) => {
    const res = await axios.put(`${API_URL}/comments/${commentId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  
  addMovie: async (token, movieData) => {
    const res = await axios.post(`${API_URL}/movies`, movieData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  updateMovie: async (token, movieId, movieData) => {
    const res = await axios.put(`${API_URL}/movies/${movieId}`, movieData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  uploadFile: async (token, type, formData) => {
    const res = await axios.post(`${API_URL}/${type}s/upload`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },
  
  deleteMovie: async (token, movieId) => {
    const res = await axios.delete(`${API_URL}/movies/${movieId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  
  addBanner: async (token, bannerData) => {
    const res = await axios.post(`${API_URL}/banners`, bannerData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  updateBanner: async (token, bannerId, bannerData) => {
    const res = await axios.put(`${API_URL}/banners/${bannerId}`, bannerData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  
  deleteBanner: async (token, bannerId) => {
    const res = await axios.delete(`${API_URL}/banners/${bannerId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  
  getMessages: async (token, receiverId) => {
    const res = await axios.get(`${API_URL}/chat`, {
      params: { receiverId },
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  
  sendMessage: async (token, messageData) => {
    const res = await axios.post(`${API_URL}/chat`, messageData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  
  deleteMessage: async (token, messageId) => {
    const res = await axios.delete(`${API_URL}/chat/${messageId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  
  editMessage: async (token, messageId, content) => {
    const res = await axios.put(`${API_URL}/chat/${messageId}`, { content }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  
  getAdmins: async (token) => {
    const res = await axios.get(`${API_URL}/users/admins`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  
  toggleBan: async (token, userId) => {
    const res = await axios.patch(`${API_URL}/users/${userId}/ban`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  }
};

export default adminService;