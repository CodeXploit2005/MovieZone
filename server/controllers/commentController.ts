import { Request, Response } from 'express';
import Comment from '../models/Comment';
import Movie from '../models/Movie';
import { AuthRequest } from '../middleware/authMiddleware';

// Helper function to update movie rating
const updateMovieRating = async (movieId: string) => {
  try {
    const movieComments = await Comment.find({ movieId });
    let avgRating = 0;
    
    if (movieComments.length > 0) {
      const totalRating = movieComments.reduce((acc, c) => acc + (c.rating || 0), 0);
      avgRating = (totalRating / movieComments.length) * 2; // Convert 1-5 to 1-10
    }
    
    const localId = movieId.startsWith('local_') ? movieId.replace('local_', '') : null;
    if (localId) {
      await Movie.findByIdAndUpdate(localId, { voteAverage: avgRating });
    } else {
      // Try to find by tmdbId if movieId is numeric
      await Movie.findOneAndUpdate({ tmdbId: movieId }, { voteAverage: avgRating });
    }
  } catch (error) {
    console.error('Error updating movie rating:', error);
  }
};

// @desc    Get comments for a movie
// @route   GET /api/comments/:movieId
// @access  Public
export const getComments = async (req: Request, res: Response) => {
  try {
    const comments = await Comment.find({ movieId: req.params.movieId })
      .populate('user', 'username avatar')
      .populate('replies.user', 'username avatar')
      .sort({ createdAt: -1 as any });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments' });
  }
};

// @desc    Add a comment
// @route   POST /api/comments
// @access  Private
export const addComment = async (req: AuthRequest, res: Response) => {
  const { movieId, content, rating } = req.body;
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });

  try {
    const comment = await Comment.create({
      user: (req.user as any)._id,
      movieId,
      content,
      rating,
    });

    const populatedComment = await Comment.findById((comment as any)._id).populate(
      'user',
      'username avatar'
    );

    // Update Movie rating
    await updateMovieRating(movieId);

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment' });
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== (req.user as any)._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    comment.content = req.body.content || comment.content;
    comment.rating = req.body.rating || comment.rating;

    const updatedComment = await comment.save();
    const populatedComment = await Comment.findById((updatedComment as any)._id).populate(
      'user',
      'username avatar'
    );

    // Update Movie rating
    await updateMovieRating(comment.movieId);

    res.json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating comment' });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (
      comment.user.toString() !== (req.user as any)._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const movieId = comment.movieId;
    await comment.deleteOne();
    
    // Update Movie rating
    await updateMovieRating(movieId);

    res.json({ success: true, message: 'Thành công! Bình luận đã được gỡ bỏ. / Success! Comment has been removed.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment' });
  }
};

// @desc    Like/Unlike a comment
// @route   POST /api/comments/:id/like
// @access  Private
export const likeComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isLiked = comment.likes.includes((req.user as any)._id);

    if (isLiked) {
      comment.likes = comment.likes.filter(
        (id) => id.toString() !== (req.user as any)._id.toString()
      );
    } else {
      comment.likes.push((req.user as any)._id);
    }

    await comment.save();
    res.json({ likes: comment.likes });
  } catch (error) {
    res.status(500).json({ message: 'Error liking comment' });
  }
};

// @desc    Reply to a comment
// @route   POST /api/comments/:id/reply
// @access  Private
export const addReply = async (req: AuthRequest, res: Response) => {
  const { content, replyToUser } = req.body;
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });

  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.replies.push({
      user: (req.user as any)._id,
      content,
      replyToUser,
      likes: [],
      createdAt: new Date()
    });

    await comment.save();

    const updatedComment = await Comment.findById((comment as any)._id)
      .populate('user', 'username avatar')
      .populate('replies.user', 'username avatar');

    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Error adding reply' });
  }
};

// @desc    Like/Unlike a reply
// @route   POST /api/comments/:id/reply/:replyId/like
// @access  Private
export const likeReply = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = (comment.replies as any).id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    if (!reply.likes) {
      reply.likes = [];
    }

    const isLiked = reply.likes.includes((req.user as any)._id);

    if (isLiked) {
      reply.likes = reply.likes.filter(
        (id: any) => id.toString() !== (req.user as any)._id.toString()
      );
    } else {
      reply.likes.push((req.user as any)._id);
    }

    await comment.save();
    res.json({ likes: reply.likes });
  } catch (error) {
    res.status(500).json({ message: 'Error liking reply' });
  }
};

// @desc    Report a comment
// @route   POST /api/comments/:id/report
// @access  Private
export const reportComment = async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });

  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user already reported
    const alreadyReported = comment.reports.some(
      (r) => r.user.toString() === (req.user as any)._id.toString()
    );

    if (alreadyReported) {
      return res.status(400).json({ message: 'You already reported this comment' });
    }

    comment.reports.push({
      user: (req.user as any)._id,
      reason,
      createdAt: new Date()
    });

    await comment.save();
    res.json({ success: true, message: 'Thành công! Báo cáo của bạn đã được gửi. / Success! Your report has been submitted.' });
  } catch (error) {
    res.status(500).json({ message: 'Error reporting comment' });
  }
};

// @desc    Delete a reply
// @route   DELETE /api/comments/:id/reply/:replyId
// @access  Private
export const deleteReply = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = (comment.replies as any).id(req.params.replyId);

    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    if (
      reply.user.toString() !== (req.user as any)._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    comment.replies = comment.replies.filter(
      (r: any) => r._id.toString() !== req.params.replyId
    );

    await comment.save();
    res.json({ success: true, message: 'Thành công! Phản hồi đã được gỡ bỏ. / Success! Reply has been removed.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting reply' });
  }
};
