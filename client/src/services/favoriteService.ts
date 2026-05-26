/// <reference types="vite/client" />
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/favorites`;

const favoriteService = {
  getFavorites: async (token: string) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.get(API_URL, config);
    return res.data;
  },

  addFavorite: async (token: string, movieData: any) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.post(`${API_URL}/add`, movieData, config);
    return res.data;
  },

  removeFavorite: async (token: string, movieId: string | number) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const res = await axios.delete(`${API_URL}/${movieId}`, config);
    return res.data;
  }
};

export default favoriteService;
