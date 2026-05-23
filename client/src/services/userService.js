import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/auth`;

const userService = {
  getWatchHistory: async (token) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.get(`${API_URL}/watch-history`, config);
    return res.data;
  },

  addToWatchHistory: async (token, movieData) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.post(`${API_URL}/watch-history`, movieData, config);
    return res.data;
  },

  deleteWatchHistory: async (token, movieId) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.delete(`${API_URL}/watch-history/${movieId}`, config);
    return res.data;
  },

  getActivity: async (token) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.get(`${API_URL}/activity`, config);
    return res.data;
  }
};

export default userService;