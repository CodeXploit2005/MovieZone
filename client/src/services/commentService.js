import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/comments`;

const commentService = {
  getComments: async (movieId) => {
    const res = await axios.get(`${API_URL}/${movieId}`);
    return res.data;
  },

  addComment: async (token, commentData) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.post(API_URL, commentData, config);
    return res.data;
  },

  updateComment: async (token, commentId, commentData) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.put(`${API_URL}/${commentId}`, commentData, config);
    return res.data;
  },

  deleteComment: async (token, commentId) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.delete(`${API_URL}/${commentId}`, config);
    return res.data;
  },

  likeComment: async (token, commentId) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.post(`${API_URL}/${commentId}/like`, {}, config);
    return res.data;
  },

  addReply: async (token, commentId, replyData) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.post(`${API_URL}/${commentId}/reply`, replyData, config);
    return res.data;
  },

  likeReply: async (token, commentId, replyId) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.post(`${API_URL}/${commentId}/reply/${replyId}/like`, {}, config);
    return res.data;
  },

  deleteReply: async (token, commentId, replyId) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.delete(`${API_URL}/${commentId}/reply/${replyId}`, config);
    return res.data;
  },

  reportComment: async (token, commentId, reason) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.post(`${API_URL}/${commentId}/report`, { reason }, config);
    return res.data;
  }
};

export default commentService;