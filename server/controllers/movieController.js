const axios = require('axios');
const Movie = require('../models/Movie');
const Banner = require('../models/Banner');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// @desc    Get trending movies
// @route   GET /api/movies/trending
// @access  Public
const getTrendingMovies = async (req, res) => {
  let { language = 'en-US', page = 1, type = 'movie' } = req.query;
  // TMDB API limits page to 500
  if (parseInt(page) > 500) page = 500;
  
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/trending/${type}/day?api_key=${process.env.TMDB_API_KEY}&language=${language}&page=${page}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trending movies' });
  }
};

// @desc    Get popular movies
// @route   GET /api/movies/popular
// @access  Public
const getPopularMovies = async (req, res) => {
  let { language = 'en-US', page = 1, type = 'movie' } = req.query;
  // TMDB API limits page to 500
  if (parseInt(page) > 500) page = 500;

  try {
    const endpoint = type === 'tv' ? 'tv/popular' : 'movie/popular';
    const response = await axios.get(
      `${TMDB_BASE_URL}/${endpoint}?api_key=${process.env.TMDB_API_KEY}&language=${language}&page=${page}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching popular movies' });
  }
};

// @desc    Get top rated movies
// @route   GET /api/movies/top-rated
// @access  Public
const getTopRatedMovies = async (req, res) => {
  let { language = 'en-US', page = 1, type = 'movie' } = req.query;
  // TMDB API limits page to 500
  if (parseInt(page) > 500) page = 500;

  try {
    const endpoint = type === 'tv' ? 'tv/top_rated' : 'movie/top_rated';
    const response = await axios.get(
      `${TMDB_BASE_URL}/${endpoint}?api_key=${process.env.TMDB_API_KEY}&language=${language}&page=${page}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching top rated movies' });
  }
};

// @desc    Get upcoming movies
// @route   GET /api/movies/upcoming
// @access  Public
const getUpcomingMovies = async (req, res) => {
  let { language = 'en-US', page = 1 } = req.query;
  // TMDB API limits page to 500
  if (parseInt(page) > 500) page = 500;

  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/upcoming?api_key=${process.env.TMDB_API_KEY}&language=${language}&page=${page}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching upcoming movies' });
  }
};

// @desc    Discover movies
// @route   GET /api/movies/discover
// @access  Public
const discoverMovies = async (req, res) => {
  let { language = 'en-US', page = 1, type = 'movie', genre, year } = req.query;
  // TMDB API limits page to 500
  if (parseInt(page) > 500) page = 500;

  try {
    let url = `${TMDB_BASE_URL}/discover/${type}?api_key=${process.env.TMDB_API_KEY}&language=${language}&page=${page}&sort_by=popularity.desc`;
    
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
const searchMovies = async (req, res) => {
  let { query, page = 1, language = 'en-US', type = 'movie' } = req.query;
  // TMDB API limits page to 500
  if (parseInt(page) > 500) page = 500;

  try {
    const endpoint = type === 'tv' ? 'search/tv' : 'search/movie';
    const response = await axios.get(
      `${TMDB_BASE_URL}/${endpoint}?api_key=${process.env.TMDB_API_KEY}&query=${query}&page=${page}&language=${language}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error searching movies' });
  }
};

// @desc    Get movie details
// @route   GET /api/movies/:id
// @access  Public
const getMovieDetails = async (req, res) => {
  const { id } = req.params;
  const { language = 'en-US', type = 'movie' } = req.query;

  try {
    // Check if it's a local movie
    if (id.startsWith('local_')) {
      const localId = id.replace('local_', '');
      const movie = await Movie.findById(localId);
      if (movie) {
        // Transform local movie to match TMDB structure as much as possible for frontend
        return res.json({
          ...movie._doc,
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
      `${TMDB_BASE_URL}/${endpoint}/${id}?api_key=${process.env.TMDB_API_KEY}&language=${language}&append_to_response=videos,credits,similar,recommendations&include_video_language=en,${language.split('-')[0]}`
    );
    res.json(movieResponse.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching movie details' });
  }
};

// @desc    Get local movies added by admin
// @route   GET /api/movies/local
// @access  Public
const getLocalMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ tmdbId: { $exists: false } }).sort({ createdAt: -1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching local movies' });
  }
};

// @desc    Get banners added by admin
// @route   GET /api/movies/banners
// @access  Public
const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).populate('movie').sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching banners' });
  }
};

module.exports = {
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  searchMovies,
  getMovieDetails,
  getLocalMovies,
  getBanners,
  discoverMovies
};
