/// <reference types="vite/client" />
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/support`;

const getAuthHeader = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const getUserMessages = async (token: string) => {
  const response = await axios.get(API_URL, getAuthHeader(token));
  return response.data;
};

const sendUserMessage = async (token: string, content: string) => {
  const response = await axios.post(API_URL, { content }, getAuthHeader(token));
  return response.data;
};

const getAdminConversations = async (token: string) => {
  const response = await axios.get(`${API_URL}/admin/conversations`, getAuthHeader(token));
  return response.data;
};

const getAdminUserMessages = async (token: string, userId: string) => {
  const response = await axios.get(`${API_URL}/admin/${userId}`, getAuthHeader(token));
  return response.data;
};

const adminReplyMessage = async (token: string, userId: string, content: string) => {
  const response = await axios.post(`${API_URL}/admin/${userId}`, { content }, getAuthHeader(token));
  return response.data;
};

const updateMessage = async (token: string, messageId: string, content: string) => {
  const response = await axios.put(`${API_URL}/${messageId}`, { content }, getAuthHeader(token));
  return response.data;
};

const deleteMessage = async (token: string, messageId: string) => {
  const response = await axios.delete(`${API_URL}/${messageId}`, getAuthHeader(token));
  return response.data;
};

const deleteConversation = async (token: string, userId: string) => {
  const response = await axios.delete(`${API_URL}/admin/conversations/${userId}`, getAuthHeader(token));
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
  deleteConversation,
};

export default supportService;
