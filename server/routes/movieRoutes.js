const express = require('express');
const router = express.Router();
const {
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  searchMovies,
  getMovieDetails,
  getLocalMovies,
  getBanners,
  discoverMovies
} = require('../controllers/movieController');

router.get('/trending', getTrendingMovies);
router.get('/popular', getPopularMovies);
router.get('/top-rated', getTopRatedMovies);
router.get('/upcoming', getUpcomingMovies);
router.get('/search', searchMovies);
router.get('/discover', discoverMovies);
router.get('/local', getLocalMovies);
router.get('/banners', getBanners);
router.get('/:id', getMovieDetails);

module.exports = router;
