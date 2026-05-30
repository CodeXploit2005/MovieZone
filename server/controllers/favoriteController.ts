import { Request, Response } from 'express';
import Favorite from '../models/Favorite';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Get user favorites
// @route   GET /api/favorites
// @access  Private
export const getFavorites = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const favorites = await Favorite.find({ user: (req.user as any)._id }).sort({ createdAt: -1 as any });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorites' });
  }
};

// @desc    Add to favorites
// @route   POST /api/favorites/add
// @access  Private
export const addFavorite = async (req: AuthRequest, res: Response) => {
  const { movieId, movieTitle, posterPath, releaseDate, voteAverage } = req.body;
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });

  try {
    const favoriteExists = await Favorite.findOne({
      user: (req.user as any)._id,
      movieId,
    });

    if (favoriteExists) {
      return res.status(400).json({ message: 'Movie already in favorites' });
    }

    // 1. Save to Favorite Collection
    const favorite = await Favorite.create({
      user: (req.user as any)._id,
      movieId,
      movieTitle,
      posterPath,
      releaseDate,
      voteAverage,
    });

    // 2. Sync to User Collection (Push ID to favorites array)
    await User.findByIdAndUpdate((req.user as any)._id, {
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
export const removeFavorite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const favorite = await Favorite.findOne({
      user: (req.user as any)._id,
      movieId: req.params.movieId,
    });

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    // 1. Delete from Favorite Collection
    await favorite.deleteOne();

    // 2. Sync to User Collection (Pull ID from favorites array)
    await User.findByIdAndUpdate((req.user as any)._id, {
      $pull: { favorites: req.params.movieId.toString() }
    });

    res.json({ success: true, message: 'Thành công! Đã xóa khỏi danh sách yêu thích. / Success! Removed from favorites.' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing favorite' });
  }
};
