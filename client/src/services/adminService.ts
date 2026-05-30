/// <reference types="vite/client" />
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/admin`;

const adminService = {
  getStats: async (token: string) => {
    const res = await axios.get(`${API_URL}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getRequests: async (token: string) => {
    const res = await axios.get(`${API_URL}/requests`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getComments: async (token: string) => {
    const res = await axios.get(`${API_URL}/comments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getMovies: async (token: string) => {
    const res = await axios.get(`${API_URL}/movies`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getBanners: async (token: string) => {
    const res = await axios.get(`${API_URL}/banners`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  approveRequest: async (token: string, userId: string, status: 'approved' | 'rejected') => {
    const res = await axios.patch(`${API_URL}/approve-request/${userId}`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  updateUserRole: async (token: string, userId: string, role: 'user' | 'admin') => {
    const res = await axios.patch(`${API_URL}/users/${userId}/role`, { role }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  deleteComment: async (token: string, commentId: string) => {
    const res = await axios.delete(`${API_URL}/comments/${commentId}`, {        
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  deleteReply: async (token: string, commentId: string, replyId: string) => {
    const res = await axios.delete(`${API_URL}/comments/${commentId}/replies/${replyId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  updateReply: async (token: string, commentId: string, replyId: string, content: string) => {
    const res = await axios.put(`${API_URL}/comments/${commentId}/replies/${replyId}`, { content }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  updateComment: async (token: string, commentId: string, data: any) => {
    const res = await axios.put(`${API_URL}/comments/${commentId}`, data, {     
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  addMovie: async (token: string, movieData: any) => {
    const res = await axios.post(`${API_URL}/movies`, movieData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  updateMovie: async (token: string, movieId: string, movieData: any) => {
    const res = await axios.put(`${API_URL}/movies/${movieId}`, movieData, {    
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  uploadFile: async (token: string, type: string, formData: FormData) => {
    const res = await axios.post(`${API_URL}/${type}s/upload`, formData, {      
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },

  deleteMovie: async (token: string, movieId: string) => {
    const res = await axios.delete(`${API_URL}/movies/${movieId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  addBanner: async (token: string, bannerData: any) => {
    const res = await axios.post(`${API_URL}/banners`, bannerData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  updateBanner: async (token: string, bannerId: string, bannerData: any) => {
    const res = await axios.put(`${API_URL}/banners/${bannerId}`, bannerData, { 
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  deleteBanner: async (token: string, bannerId: string) => {
    const res = await axios.delete(`${API_URL}/banners/${bannerId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getAdminMessages: async (token: string, receiverId?: string, groupId?: string) => {
    const res = await axios.get(`${API_URL}/chat`, {
      params: { receiverId, groupId },
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  sendAdminMessage: async (token: string, content: string, receiverId?: string, groupId?: string) => {
    const res = await axios.post(`${API_URL}/chat`, { content, receiverId, groupId }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getAdminGroups: async (token: string) => {
    const res = await axios.get(`${API_URL}/chat/groups`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  createAdminGroup: async (token: string, name: string, members: string[]) => {
    const res = await axios.post(`${API_URL}/chat/groups`, { name, members }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  deleteAdminGroup: async (token: string, id: string) => {
    const res = await axios.delete(`${API_URL}/chat/groups/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  deleteMessage: async (token: string, messageId: string) => {
    const res = await axios.delete(`${API_URL}/chat/${messageId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  editMessage: async (token: string, messageId: string, content: string) => {
    const res = await axios.put(`${API_URL}/chat/${messageId}`, { content }, {  
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getAdmins: async (token: string) => {
    const res = await axios.get(`${API_URL}/users/admins`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  toggleBan: async (token: string, userId: string) => {
    const res = await axios.patch(`${API_URL}/users/${userId}/ban`, {}, {       
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  }
};

export default adminService;
