const User = require('../models/User');
const Comment = require('../models/Comment');
const Movie = require('../models/Movie');
const Banner = require('../models/Banner');
const AdminMessage = require('../models/AdminMessage');

// @desc    Get all admins
// @route   GET /api/admin/users/admins
// @access  Private/Admin
const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('username avatar email');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all admin chat messages
// @route   GET /api/admin/chat
// @access  Private/Admin
const getAdminMessages = async (req, res) => {
  try {
    const { receiverId } = req.query;
    
    let query = { receiver: null }; // Default to group chat
    
    if (receiverId && receiverId !== 'group') {
      // Private chat: messages between current user and receiver
      query = {
        $or: [
          { user: req.user._id, receiver: receiverId },
          { user: receiverId, receiver: req.user._id }
        ]
      };
    }

    const messages = await AdminMessage.find(query)
      .populate('user', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send an admin chat message
// @route   POST /api/admin/chat
// @access  Private/Admin
const sendAdminMessage = async (req, res) => {
  try {
    const { content, receiverId } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const message = await AdminMessage.create({
      user: req.user._id,
      receiver: (receiverId && receiverId !== 'group') ? receiverId : null,
      content
    });

    const populatedMessage = await AdminMessage.findById(message._id)
      .populate('user', 'username avatar')
      .populate('receiver', 'username avatar');
    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an admin chat message
// @route   DELETE /api/admin/chat/:id
// @access  Private/Admin
const deleteAdminMessage = async (req, res) => {
  try {
    const message = await AdminMessage.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only allow user to delete their own message
    if (message.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await message.deleteOne();
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an admin chat message
// @route   PUT /api/admin/chat/:id
// @access  Private/Admin
const updateAdminMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const message = await AdminMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only allow user to edit their own message
    if (message.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    message.content = content || message.content;
    message.isEdited = true;
    await message.save();

    const populatedMessage = await AdminMessage.findById(message._id)
      .populate('user', 'username avatar')
      .populate('receiver', 'username avatar');
    res.json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all pending admin requests
// @route   GET /api/admin/requests
// @access  Private/Admin
const getAdminRequests = async (req, res) => {
  const requests = await User.find({ adminRequestStatus: 'pending' }).select('-password');
  res.json(requests);
};

// @desc    Approve or reject admin request
// @route   PATCH /api/admin/approve-request/:userId
// @access  Private/Admin
const approveAdminRequest = async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  const user = await User.findById(req.params.userId);

  if (user) {
    user.adminRequestStatus = status;
    if (status === 'approved') {
      user.role = 'admin';
    }
    await user.save();
    res.json({ success: true, message: `Request ${status}` });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

// @desc    Get all comments for management
// @route   GET /api/admin/comments
// @access  Private/Admin
const getAllComments = async (req, res) => {
  try {
    const comments = await Comment.find({})
      .populate('user', 'username avatar email')
      .populate('replies.user', 'username avatar')
      .sort({ createdAt: -1 });

    // Fetch all movies involved in these comments to avoid N+1 query lag
    const movieIds = [...new Set(comments.map(c => c.movieId))];
    const movies = await Movie.find({ tmdbId: { $in: movieIds } });
    const movieMap = movies.reduce((acc, m) => {
      acc[m.tmdbId] = m.title;
      return acc;
    }, {});

    const commentsWithInfo = comments.map(c => ({
      ...c._doc,
      movieTitle: movieMap[c.movieId] || `Movie ID: ${c.movieId}`,
      likesCount: c.likes?.length || 0,
      repliesCount: c.replies?.length || 0,
      reportsCount: c.reports?.length || 0,
      replies: c.replies.map(r => ({
        ...r._doc,
        likesCount: r.likes?.length || 0
      }))
    }));

    res.json(commentsWithInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a comment
// @route   PUT /api/admin/comments/:id
// @access  Private/Admin
const updateComment = async (req, res) => {
  const { content } = req.body;
  const comment = await Comment.findById(req.params.id);

  if (comment) {
    comment.content = content || comment.content;
    await comment.save();
    res.json({ success: true, message: 'Comment updated' });
  } else {
    res.status(404);
    throw new Error('Comment not found');
  }
};

// @desc    Delete a reply
// @route   DELETE /api/admin/comments/:id/replies/:replyId
// @access  Private/Admin
const deleteReply = async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (comment) {
    comment.replies = comment.replies.filter(
      (reply) => reply._id.toString() !== req.params.replyId
    );
    await comment.save();
    res.json({ success: true, message: 'Reply deleted' });
  } else {
    res.status(404);
    throw new Error('Comment not found');
  }
};

// @desc    Update a reply
// @route   PUT /api/admin/comments/:id/replies/:replyId
// @access  Private/Admin
const updateReply = async (req, res) => {
  const { content } = req.body;
  const comment = await Comment.findById(req.params.id);

  if (comment) {
    const reply = comment.replies.find(
      (r) => r._id.toString() === req.params.replyId
    );
    if (reply) {
      reply.content = content || reply.content;
      await comment.save();
      res.json({ success: true, message: 'Reply updated' });
    } else {
      res.status(404);
      throw new Error('Reply not found');
    }
  } else {
    res.status(404);
    throw new Error('Comment not found');
  }
};

// @desc    Delete a comment
// @route   DELETE /api/admin/comments/:id
// @access  Private/Admin
const deleteComment = async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (comment) {
    await comment.deleteOne();
    res.json({ success: true, message: 'Comment deleted' });
  } else {
    res.status(404);
    throw new Error('Comment not found');
  }
};

// @desc    Get detailed statistics for dashboard
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const commentCount = await Comment.countDocuments();
    const movieCount = await Movie.countDocuments();
    
    // Last 7 days login activity
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    // Latest users (10)
    const latestUsers = await User.find({}).sort({ createdAt: -1 }).limit(10).select('-password');

    // Health Chart data: Last 7 days activity
    const healthChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const count = await User.countDocuments({
        lastLogin: { $gte: startOfDay, $lte: endOfDay }
      });
      
      healthChart.push({
        name: startOfDay.toLocaleDateString('vi-VN', { weekday: 'short' }),
        date: startOfDay.toLocaleDateString('vi-VN'),
        users: count
      });
    }

    // Movie distribution by genre (first genre)
    const movies = await Movie.find({});
    const genreMap = {};
    movies.forEach(m => {
      if (m.genres && m.genres.length > 0) {
        const primaryGenre = m.genres[0];
        genreMap[primaryGenre] = (genreMap[primaryGenre] || 0) + 1;
      }
    });
    
    const movieStorage = Object.keys(genreMap).map(genre => ({
      genre,
      count: genreMap[genre]
    }));

    // Add 0 count for common genres if missing
    const commonGenres = ['Hành Động', 'Anime', 'Tình Cảm', 'Kinh Dị', 'Viễn Tưởng', 'Hài Hước'];
    commonGenres.forEach(g => {
      if (!genreMap[g]) {
        movieStorage.push({ genre: g, count: 0 });
      }
    });

    // Latest unmoderated comments (unread or recent)
    const latestComments = await Comment.find({})
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      users: userCount,
      comments: commentCount,
      movies: movieCount,
      activeUsers,
      latestUsers,
      healthChart,
      movieStorage,
      latestComments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user ban status
// @route   PATCH /api/admin/users/:id/ban
// @access  Private/Admin
const toggleUserBan = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.role === 'admin' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Cannot ban another admin' });
      }
      user.isBanned = !user.isBanned;
      await user.save();
      res.json({ success: true, isBanned: user.isBanned });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user role
// @route   PATCH /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (user) {
      user.role = role;
      await user.save();
      res.json({ success: true, role: user.role });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new movie
// @route   POST /api/admin/movies
// @access  Private/Admin
const addMovie = async (req, res) => {
  try {
    const movie = await Movie.create(req.body);
    res.status(201).json(movie);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a movie
// @route   PUT /api/admin/movies/:id
// @access  Private/Admin
const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (movie) {
      res.json(movie);
    } else {
      res.status(404).json({ message: 'Movie not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all movies for admin
// @route   GET /api/admin/movies
// @access  Private/Admin
const getAllMovies = async (req, res) => {
  const movies = await Movie.find({}).sort({ createdAt: -1 });
  res.json(movies);
};

// @desc    Delete a movie
// @route   DELETE /api/admin/movies/:id
// @access  Private/Admin
const deleteMovie = async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (movie) {
    await movie.deleteOne();
    res.json({ message: 'Movie removed' });
  } else {
    res.status(404);
    throw new Error('Movie not found');
  }
};

// @desc    Add a new banner
// @route   POST /api/admin/banners
// @access  Private/Admin
const addBanner = async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json(banner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a banner
// @route   PUT /api/admin/banners/:id
// @access  Private/Admin
const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('movie', 'title');
    if (banner) {
      res.json(banner);
    } else {
      res.status(404).json({ message: 'Banner not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all banners
// @route   GET /api/admin/banners
// @access  Private/Admin
const getAllBanners = async (req, res) => {
  const banners = await Banner.find({}).populate('movie', 'title');
  res.json(banners);
};

// @desc    Delete a banner
// @route   DELETE /api/admin/banners/:id
// @access  Private/Admin
const deleteBanner = async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (banner) {
    await banner.deleteOne();
    res.json({ message: 'Banner removed' });
  } else {
    res.status(404);
    throw new Error('Banner not found');
  }
};

// @desc    Upload movie file (poster or backdrop)
// @route   POST /api/admin/movies/upload
// @access  Private/Admin
const uploadMovieFile = async (req, res) => {
  if (req.file) {
    res.json({ url: req.file.path });
  } else {
    res.status(400);
    throw new Error('No file uploaded');
  }
};

// @desc    Upload banner image
// @route   POST /api/admin/banners/upload
// @access  Private/Admin
const uploadBannerFile = async (req, res) => {
  if (req.file) {
    res.json({ url: req.file.path });
  } else {
    res.status(400);
    throw new Error('No file uploaded');
  }
};

module.exports = {
  getAdminRequests,
  approveAdminRequest,
  getAllComments,
  deleteComment,
  getStats,
  addMovie,
  updateMovie,
  addBanner,
  updateBanner,
  getAllMovies,
  getAllBanners,
  deleteMovie,
  deleteBanner,
  updateComment,
  deleteReply,
  updateReply,
  uploadMovieFile,
  uploadBannerFile,
  toggleUserBan,
  updateUserRole,
  getAdminMessages,
  sendAdminMessage,
  deleteAdminMessage,
  updateAdminMessage,
  getAllAdmins
};
