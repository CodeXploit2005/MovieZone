import { Request, Response } from 'express';
import axios from 'axios';
import Movie from '../models/Movie';
import Banner from '../models/Banner';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// @desc    Get trending movies
// @route   GET /api/movies/trending
// @access  Public
export const getTrendingMovies = async (req: Request, res: Response) => {
  let { language = 'en-US', page = 1, type = 'movie' } = req.query;
  let pageNum = typeof page === 'string' ? parseInt(page) : Number(page);
  // TMDB API limits page to 500
  if (pageNum > 500) pageNum = 500;
  
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/trending/${type}/day?api_key=${process.env.TMDB_API_KEY}&language=${language}&page=${pageNum}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trending movies' });
  }
};

// @desc    Get popular movies
// @route   GET /api/movies/popular
// @access  Public
export const getPopularMovies = async (req: Request, res: Response) => {
  let { language = 'en-US', page = 1, type = 'movie' } = req.query;
  let pageNum = typeof page === 'string' ? parseInt(page) : Number(page);
  // TMDB API limits page to 500
  if (pageNum > 500) pageNum = 500;

  try {
    const endpoint = type === 'tv' ? 'tv/popular' : 'movie/popular';
    const response = await axios.get(
      `${TMDB_BASE_URL}/${endpoint}?api_key=${process.env.TMDB_API_KEY}&language=${language}&page=${pageNum}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching popular movies' });
  }
};

// @desc    Get top rated movies
// @route   GET /api/movies/top-rated
// @access  Public
export const getTopRatedMovies = async (req: Request, res: Response) => {
  let { language = 'en-US', page = 1, type = 'movie' } = req.query;
  let pageNum = typeof page === 'string' ? parseInt(page) : Number(page);
  // TMDB API limits page to 500
  if (pageNum > 500) pageNum = 500;

  try {
    const endpoint = type === 'tv' ? 'tv/top_rated' : 'movie/top_rated';
    const response = await axios.get(
      `${TMDB_BASE_URL}/${endpoint}?api_key=${process.env.TMDB_API_KEY}&language=${language}&page=${pageNum}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching top rated movies' });
  }
};

// @desc    Get upcoming movies
// @route   GET /api/movies/upcoming
// @access  Public
export const getUpcomingMovies = async (req: Request, res: Response) => {
  let { language = 'en-US', page = 1 } = req.query;
  let pageNum = typeof page === 'string' ? parseInt(page) : Number(page);
  // TMDB API limits page to 500
  if (pageNum > 500) pageNum = 500;

  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/upcoming?api_key=${process.env.TMDB_API_KEY}&language=${language}&page=${pageNum}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching upcoming movies' });
  }
};

// @desc    Discover movies
// @route   GET /api/movies/discover
// @access  Public
export const discoverMovies = async (req: Request, res: Response) => {
  let { language = 'en-US', page = 1, type = 'movie', genre, year } = req.query;
  let pageNum = typeof page === 'string' ? parseInt(page) : Number(page);
  // TMDB API limits page to 500
  if (pageNum > 500) pageNum = 500;

  try {
    let url = `${TMDB_BASE_URL}/discover/${type}?api_key=${process.env.TMDB_API_KEY}&language=${language}&page=${pageNum}&sort_by=popularity.desc`;
    
    if (genre) url += `&with_genres=${genre}`;
    if (year) {
      const yearParam = type === 'tv' ? 'first_air_date_year' : 'primary_release_year';
      url += `&${yearParam}=${year}`;
    }

    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error discovering movies' });
  }
};

// @desc    Search movies
// @route   GET /api/movies/search
// @access  Public
export const searchMovies = async (req: Request, res: Response) => {
  let { query, page = 1, language = 'en-US', type = 'movie' } = req.query;
  let pageNum = typeof page === 'string' ? parseInt(page) : Number(page);
  // TMDB API limits page to 500
  if (pageNum > 500) pageNum = 500;

  try {
    const endpoint = type === 'tv' ? 'search/tv' : 'search/movie';
    const response = await axios.get(
      `${TMDB_BASE_URL}/${endpoint}?api_key=${process.env.TMDB_API_KEY}&query=${query}&page=${pageNum}&language=${language}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error searching movies' });
  }
};

// @desc    Get movie details
// @route   GET /api/movies/:id
// @access  Public
export const getMovieDetails = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { language = 'en-US', type = 'movie' } = req.query;

  try {
    // Check if it's a local movie
    if (id && id.startsWith('local_')) {
      const localId = id.replace('local_', '');
      const movie = await Movie.findByIdAndUpdate(
        localId,
        { $inc: { views: 1 } },
        { new: true }
      );
      if (movie) {
        // Transform local movie to match TMDB structure as much as possible for frontend
        return res.json({
          ...(movie as any)._doc,
          id: movie._id,
          poster_path: movie.posterPath,
          backdrop_path: movie.posterPath, // Use poster as backdrop if not available
          release_date: movie.releaseDate,
          vote_average: movie.voteAverage || 0,
          genres: movie.genres.map(g => ({ name: g })),
           isLocal: true,
           overview: movie.description,
           runtime: movie.runtime || 120, // Use stored runtime or default
           production_countries: [{ name: movie.country || 'N/A' }],
           tagline: 'MovieZone Exclusive'
        });
      } else {
        return res.status(404).json({ message: 'Local movie not found' });
      }
    }

    const endpoint = type === 'tv' ? 'tv' : 'movie';
    const movieResponse = await axios.get(
      `${TMDB_BASE_URL}/${endpoint}/${id}?api_key=${process.env.TMDB_API_KEY}&language=${language}&append_to_response=videos,credits,similar,recommendations&include_video_language=en,${(language as string).split('-')[0]}`
    );
    res.json(movieResponse.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching movie details' });
  }
};

// @desc    Get local movies added by admin
// @route   GET /api/movies/local
// @access  Public
export const getLocalMovies = async (req: Request, res: Response) => {
  try {
    const movies = await Movie.find({ tmdbId: { $exists: false } }).sort({ createdAt: -1 as any });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching local movies' });
  }
};

// @desc    Get banners added by admin
// @route   GET /api/movies/banners
// @access  Public
export const getBanners = async (req: Request, res: Response) => {
  try {
    const banners = await Banner.find({ isActive: true }).populate('movie').sort({ order: 1 as any });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching banners' });
  }
};
