const Favorite = require('../models/Favorite');
const User = require('../models/User');

// @desc    Get user favorites
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorites' });
  }
};

// @desc    Add to favorites
// @route   POST /api/favorites/add
// @access  Private
const addFavorite = async (req, res) => {
  const { movieId, movieTitle, posterPath, releaseDate, voteAverage } = req.body;

  try {
    const favoriteExists = await Favorite.findOne({
      user: req.user._id,
      movieId,
    });

    if (favoriteExists) {
      return res.status(400).json({ message: 'Movie already in favorites' });
    }

    // 1. Save to Favorite Collection
    const favorite = await Favorite.create({
      user: req.user._id,
      movieId,
      movieTitle,
      posterPath,
      releaseDate,
      voteAverage,
    });

    // 2. Sync to User Collection (Push ID to favorites array)
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { favorites: movieId.toString() }
    });

    res.status(201).json(favorite);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding favorite' });
  }
};

// @desc    Remove from favorites
// @route   DELETE /api/favorites/:movieId
// @access  Private
const removeFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      user: req.user._id,
      movieId: req.params.movieId,
    });

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    // 1. Delete from Favorite Collection
    await favorite.deleteOne();

    // 2. Sync to User Collection (Pull ID from favorites array)
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { favorites: req.params.movieId.toString() }
    });

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing favorite' });
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
};
