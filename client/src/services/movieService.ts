/// <reference types="vite/client" />
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/movies`;

const movieService = {
  getAllMovies: async (params: any) => {
    const res = await axios.get(API_URL, { params });
    return res.data;
  },

  getMovieById: async (id: string | number, language: string, type = 'movie') => {
    const res = await axios.get(`${API_URL}/${id}`, { params: { language, type } });
    return res.data;
  },

  searchMovies: async (query: string, page: number, type: string, language: string) => {
    const res = await axios.get(`${API_URL}/search`, {
      params: { query, page, type, language }
    });
    return res.data;
  },

  getPopularMovies: async (page: number, language: string, type = 'movie') => {
    const res = await axios.get(`${API_URL}/popular`, {
      params: { page, language, type }
    });
    return res.data;
  },

  getTrendingMovies: async (page: number, language: string, type = 'movie') => {
    const res = await axios.get(`${API_URL}/trending`, {
      params: { page, language, type }
    });
    return res.data;
  },

  discoverMovies: async (params: any) => {
    const res = await axios.get(`${API_URL}/discover`, { params });
    return res.data;
  },

  getTopRatedMovies: async (page: number, language: string, type = 'movie') => {
    const res = await axios.get(`${API_URL}/top-rated`, {
      params: { page, language, type }
    });
    return res.data;
  },

  getUpcomingMovies: async (page: number, language: string) => {
    const res = await axios.get(`${API_URL}/upcoming`, {
      params: { page, language }
    });
    return res.data;
  },

  getLocalMovies: async () => {
    const res = await axios.get(`${API_URL}/local`);
    return res.data;
  },

  getBannerMovies: async () => {
    const res = await axios.get(`${API_URL}/banners`);
    return res.data;
  }
};

export default movieService;
