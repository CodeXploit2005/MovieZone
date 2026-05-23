import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/support`;

const getAuthHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const getUserMessages = async (token) => {
  const response = await axios.get(API_URL, getAuthHeader(token));
  return response.data;
};

const sendUserMessage = async (token, content) => {
  const response = await axios.post(API_URL, { content }, getAuthHeader(token));
  return response.data;
};

const getAdminConversations = async (token) => {
  const response = await axios.get(`${API_URL}/admin/conversations`, getAuthHeader(token));
  return response.data;
};

const getAdminUserMessages = async (token, userId) => {
  const response = await axios.get(`${API_URL}/admin/${userId}`, getAuthHeader(token));
  return response.data;
};

const adminReplyMessage = async (token, userId, content) => {
  const response = await axios.post(`${API_URL}/admin/${userId}`, { content }, getAuthHeader(token));
  return response.data;
};

const updateMessage = async (token, messageId, content) => {
  const response = await axios.put(`${API_URL}/${messageId}`, { content }, getAuthHeader(token));
  return response.data;
};

const deleteMessage = async (token, messageId) => {
  const response = await axios.delete(`${API_URL}/${messageId}`, getAuthHeader(token));
  return response.data;
};

const supportService = {
  getUserMessages,
  sendUserMessage,
  getAdminConversations,
  getAdminUserMessages,
  adminReplyMessage,
  updateMessage,
  deleteMessage,
};

export default supportService;
