const Comment = require('../models/Comment');

// @desc    Get comments for a movie
// @route   GET /api/comments/:movieId
// @access  Public
const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ movieId: req.params.movieId })
      .populate('user', 'username avatar')
      .populate('replies.user', 'username avatar')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments' });
  }
};

// @desc    Add a comment
// @route   POST /api/comments
// @access  Private
const addComment = async (req, res) => {
  const { movieId, content, rating } = req.body;

  try {
    const comment = await Comment.create({
      user: req.user._id,
      movieId,
      content,
      rating,
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      'user',
      'username avatar'
    );

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment' });
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    comment.content = req.body.content || comment.content;
    comment.rating = req.body.rating || comment.rating;

    const updatedComment = await comment.save();
    const populatedComment = await Comment.findById(updatedComment._id).populate(
      'user',
      'username avatar'
    );

    res.json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating comment' });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (
      comment.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment' });
  }
};

// @desc    Like/Unlike a comment
// @route   POST /api/comments/:id/like
// @access  Private
const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isLiked = comment.likes.includes(req.user._id);

    if (isLiked) {
      comment.likes = comment.likes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      comment.likes.push(req.user._id);
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
const addReply = async (req, res) => {
  const { content, replyToUser } = req.body;

  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.replies.push({
      user: req.user._id,
      content,
      replyToUser,
    });

    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
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
const likeReply = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = comment.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    if (!reply.likes) {
      reply.likes = [];
    }

    const isLiked = reply.likes.includes(req.user._id);

    if (isLiked) {
      reply.likes = reply.likes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      reply.likes.push(req.user._id);
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
const reportComment = async (req, res) => {
  const { reason } = req.body;

  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user already reported
    const alreadyReported = comment.reports.some(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReported) {
      return res.status(400).json({ message: 'You already reported this comment' });
    }

    comment.reports.push({
      user: req.user._id,
      reason,
    });

    await comment.save();
    res.json({ message: 'Comment reported successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error reporting comment' });
  }
};

// @desc    Delete a reply
// @route   DELETE /api/comments/:id/reply/:replyId
// @access  Private
const deleteReply = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = comment.replies.id(req.params.replyId);

    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    if (
      reply.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    comment.replies = comment.replies.filter(
      (r) => r._id.toString() !== req.params.replyId
    );

    await comment.save();
    res.json({ message: 'Reply removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting reply' });
  }
};

module.exports = {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  likeComment,
  addReply,
  likeReply,
  reportComment,
  deleteReply,
};
