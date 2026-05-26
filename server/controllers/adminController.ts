import { Request, Response } from 'express';
import User from '../models/User';
import Comment from '../models/Comment';
import Movie from '../models/Movie';
import Banner from '../models/Banner';
import AdminMessage from '../models/AdminMessage';
import AdminGroup from '../models/AdminGroup';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Get all admins
// @route   GET /api/admin/users/admins
// @access  Private/Admin
export const getAllAdmins = async (req: AuthRequest, res: Response) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('username avatar email');
    res.json(admins);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all admin chat messages
// @route   GET /api/admin/chat
// @access  Private/Admin
export const getAdminMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, groupId } = req.query;
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    let query: any = { receiver: null, groupId: null }; // Default to global group chat
    
    if (groupId) {
      query = { groupId };
    } else if (receiverId && receiverId !== 'group') {
      // Private chat: messages between current user and receiver
      query = {
        $or: [
          { user: (req.user as any)._id, receiver: receiverId },
          { user: receiverId, receiver: (req.user as any)._id }
        ],
        groupId: null
      };
    }

    const messages = await AdminMessage.find(query)
      .populate('user', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: -1 as any })
      .limit(50);
    res.json(messages.reverse());
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send an admin chat message
// @route   POST /api/admin/chat
// @access  Private/Admin
export const sendAdminMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { content, receiverId, groupId } = req.body;
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const message = await AdminMessage.create({
      user: (req.user as any)._id,
      receiver: (receiverId && receiverId !== 'group') ? receiverId : null,
      groupId: groupId || null,
      content
    });

    const populatedMessage = await AdminMessage.findById((message as any)._id)
      .populate('user', 'username avatar')
      .populate('receiver', 'username avatar');
    res.status(201).json(populatedMessage);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new admin chat group
// @route   POST /api/admin/chat/groups
// @access  Private/Admin
export const createAdminGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { name, members } = req.body;
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    
    // Add creator to members if not already there
    const memberIds = [...new Set([...members, (req.user as any)._id])];

    const group = await AdminGroup.create({
      name,
      members: memberIds,
      createdBy: (req.user as any)._id
    });

    const populatedGroup = await AdminGroup.findById((group as any)._id)
      .populate('members', 'username avatar email')
      .populate('createdBy', 'username avatar');

    res.status(201).json(populatedGroup);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all admin chat groups for the current user
// @route   GET /api/admin/chat/groups
// @access  Private/Admin
export const getAdminGroups = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const groups = await AdminGroup.find({ members: (req.user as any)._id })
      .populate('members', 'username avatar email')
      .populate('createdBy', 'username avatar')
      .sort({ updatedAt: -1 as any });
    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an admin chat group
// @route   DELETE /api/admin/chat/groups/:id
// @access  Private/Admin
export const deleteAdminGroup = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const group = await AdminGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Only allow creator to delete group
    if (group.createdBy.toString() !== (req.user as any)._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this group' });
    }

    await AdminMessage.deleteMany({ groupId: group._id });
    await group.deleteOne();
    res.json({ success: true, message: 'Thành công! Nhóm đã được xóa. / Success! Group has been deleted.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an admin chat message
// @route   DELETE /api/admin/chat/:id
// @access  Private/Admin
export const deleteAdminMessage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const message = await AdminMessage.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only allow user to delete their own message
    if (message.user.toString() !== (req.user as any)._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await message.deleteOne();
    res.json({ success: true, message: 'Thành công! Tin nhắn đã được xóa. / Success! Message has been deleted.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an admin chat message
// @route   PUT /api/admin/chat/:id
// @access  Private/Admin
export const updateAdminMessage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { content } = req.body;
    const message = await AdminMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only allow user to edit their own message
    if (message.user.toString() !== (req.user as any)._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    message.content = content || message.content;
    message.isEdited = true;
    await message.save();

    const populatedMessage = await AdminMessage.findById((message as any)._id)
      .populate('user', 'username avatar')
      .populate('receiver', 'username avatar');
    res.json(populatedMessage);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all pending admin requests
// @route   GET /api/admin/requests
// @access  Private/Admin
export const getAdminRequests = async (req: Request, res: Response) => {
  const requests = await User.find({ adminRequestStatus: 'pending' }).select('-password');
  res.json(requests);
};

// @desc    Approve or reject admin request
// @route   PATCH /api/admin/approve-request/:userId
// @access  Private/Admin
export const approveAdminRequest = async (req: Request, res: Response) => {
  const { status } = req.body; // 'approved' or 'rejected'
  const user = await User.findById(req.params.userId);

  if (user) {
    user.adminRequestStatus = status;
    if (status === 'approved') {
      user.role = 'admin';
    }
    await user.save();
    res.json({ success: true, message: `Thành công! Yêu cầu đã được ${status === 'approved' ? 'chấp nhận' : 'từ chối'}. / Success! Request has been ${status}.` });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

// @desc    Get all comments for management
// @route   GET /api/admin/comments
// @access  Private/Admin
export const getAllComments = async (req: Request, res: Response) => {
  try {
    const comments = await Comment.find({})
      .populate('user', 'username avatar email')
      .populate('replies.user', 'username avatar')
      .sort({ createdAt: -1 as any });

    // Fetch all movies involved in these comments to avoid N+1 query lag
    const movieIds = [...new Set(comments.map(c => c.movieId))];
    const movies = await Movie.find({ tmdbId: { $in: movieIds } });
    const movieMap = movies.reduce((acc: any, m: any) => {
      acc[m.tmdbId] = m.title;
      return acc;
    }, {});

    const commentsWithInfo = comments.map(c => ({
      ...(c as any)._doc,
      movieTitle: movieMap[c.movieId] || `Movie ID: ${c.movieId}`,
      likesCount: c.likes?.length || 0,
      repliesCount: c.replies?.length || 0,
      reportsCount: c.reports?.length || 0,
      replies: c.replies.map(r => ({
        ...(r as any)._doc,
        likesCount: r.likes?.length || 0
      }))
    }));

    res.json(commentsWithInfo);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a comment
// @route   PUT /api/admin/comments/:id
// @access  Private/Admin
export const updateComment = async (req: Request, res: Response) => {
  const { content } = req.body;
  const comment = await Comment.findById(req.params.id);

  if (comment) {
    comment.content = content || comment.content;
    await comment.save();
    res.json({ success: true, message: 'Thành công! Bình luận đã được cập nhật. / Success! Comment has been updated.' });
  } else {
    res.status(404);
    throw new Error('Comment not found');
  }
};

// @desc    Delete a reply
// @route   DELETE /api/admin/comments/:id/replies/:replyId
// @access  Private/Admin
export const deleteReply = async (req: Request, res: Response) => {
  const comment = await Comment.findById(req.params.id);

  if (comment) {
    comment.replies = comment.replies.filter(
      (reply: any) => reply._id.toString() !== req.params.replyId
    );
    await comment.save();
    res.json({ success: true, message: 'Thành công! Phản hồi đã được xóa. / Success! Reply has been deleted.' });
  } else {
    res.status(404);
    throw new Error('Comment not found');
  }
};

// @desc    Update a reply
// @route   PUT /api/admin/comments/:id/replies/:replyId
// @access  Private/Admin
export const updateReply = async (req: Request, res: Response) => {
  const { content } = req.body;
  const comment = await Comment.findById(req.params.id);

  if (comment) {
    const reply = comment.replies.find(
      (r: any) => r._id.toString() === req.params.replyId
    );
    if (reply) {
      reply.content = content || reply.content;
      await comment.save();
      res.json({ success: true, message: 'Thành công! Phản hồi đã được cập nhật. / Success! Reply has been updated.' });
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
export const deleteComment = async (req: Request, res: Response) => {
  const comment = await Comment.findById(req.params.id);
  if (comment) {
    await comment.deleteOne();
    res.json({ success: true, message: 'Thành công! Bình luận đã được xóa. / Success! Comment has been deleted.' });
  } else {
    res.status(404);
    throw new Error('Comment not found');
  }
};

// @desc    Get detailed statistics for dashboard
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getStats = async (req: Request, res: Response) => {
  try {
    const userCount = await User.countDocuments();
    const commentCount = await Comment.countDocuments();
    const movieCount = await Movie.countDocuments();
    
    // Last 7 days login activity
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    // Latest users (10)
    const latestUsers = await User.find({}).sort({ createdAt: -1 as any }).limit(10).select('-password');

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
    const genreMap: any = {};
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
      .sort({ createdAt: -1 as any })
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
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user ban status
// @route   PATCH /api/admin/users/:id/ban
// @access  Private/Admin
export const toggleUserBan = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.role === 'admin' && (req.user as any).role !== 'admin') {
        return res.status(403).json({ message: 'Cannot ban another admin' });
      }
      user.isBanned = !user.isBanned;
      await user.save();
      res.json({ success: true, isBanned: user.isBanned });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user role
// @route   PATCH /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req: Request, res: Response) => {
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
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new movie
// @route   POST /api/admin/movies
// @access  Private/Admin
export const addMovie = async (req: Request, res: Response) => {
  try {
    const movie = await Movie.create(req.body);
    res.status(201).json({
      success: true,
      data: movie,
      message: 'Thành công! Phim mới đã được thêm vào hệ thống. / Success! New movie has been added to the system.'
    });
  } catch (error: any) {
    res.status(400).json({ message: `Lỗi: ${error.message} / Error: ${error.message}` });
  }
};

// @desc    Update a movie
// @route   PUT /api/admin/movies/:id
// @access  Private/Admin
export const updateMovie = async (req: Request, res: Response) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (movie) {
      res.json({
        success: true,
        data: movie,
        message: 'Thành công! Thông tin phim đã được cập nhật. / Success! Movie information has been updated.'
      });
    } else {
      res.status(404).json({ message: 'Không tìm thấy phim / Movie not found' });
    }
  } catch (error: any) {
    res.status(400).json({ message: `Lỗi: ${error.message} / Error: ${error.message}` });
  }
};

// @desc    Get all movies for admin
// @route   GET /api/admin/movies
// @access  Private/Admin
export const getAllMovies = async (req: Request, res: Response) => {
  const movies = await Movie.find({}).sort({ createdAt: -1 as any });
  res.json(movies);
};

// @desc    Delete a movie
// @route   DELETE /api/admin/movies/:id
// @access  Private/Admin
export const deleteMovie = async (req: Request, res: Response) => {
  const movie = await Movie.findById(req.params.id);
  if (movie) {
    await movie.deleteOne();
    res.json({ success: true, message: 'Thành công! Phim đã được gỡ bỏ khỏi hệ thống. / Success! Movie has been removed from the system.' });
  } else {
    res.status(404);
    throw new Error('Movie not found');
  }
};

// @desc    Add a new banner
// @route   POST /api/admin/banners
// @access  Private/Admin
export const addBanner = async (req: Request, res: Response) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json({
      success: true,
      data: banner,
      message: 'Thành công! Banner mới đã được thêm. / Success! New banner has been added.'
    });
  } catch (error: any) {
    res.status(400).json({ message: `Lỗi: ${error.message} / Error: ${error.message}` });
  }
};

// @desc    Update a banner
// @route   PUT /api/admin/banners/:id
// @access  Private/Admin
export const updateBanner = async (req: Request, res: Response) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('movie', 'title');
    if (banner) {
      res.json({
        success: true,
        data: banner,
        message: 'Thành công! Banner đã được cập nhật. / Success! Banner has been updated.'
      });
    } else {
      res.status(404).json({ message: 'Không tìm thấy Banner / Banner not found' });
    }
  } catch (error: any) {
    res.status(400).json({ message: `Lỗi: ${error.message} / Error: ${error.message}` });
  }
};

// @desc    Get all banners
// @route   GET /api/admin/banners
// @access  Private/Admin
export const getAllBanners = async (req: Request, res: Response) => {
  const banners = await Banner.find({}).populate('movie', 'title');
  res.json(banners);
};

// @desc    Delete a banner
// @route   DELETE /api/admin/banners/:id
// @access  Private/Admin
export const deleteBanner = async (req: Request, res: Response) => {
  const banner = await Banner.findById(req.params.id);
  if (banner) {
    await banner.deleteOne();
    res.json({ success: true, message: 'Thành công! Banner đã được gỡ bỏ. / Success! Banner has been removed.' });
  } else {
    res.status(404);
    throw new Error('Banner not found');
  }
};

// @desc    Upload movie file (poster or backdrop)
// @route   POST /api/admin/movies/upload
// @access  Private/Admin
export const uploadMovieFile = async (req: AuthRequest, res: Response) => {
  if (req.file) {
    res.json({ 
      success: true,
      url: (req.file as any).path || (req.file as any).secure_url,
      message: 'Tải tệp phim lên thành công / Movie file uploaded successfully'
    });
  } else {
    res.status(400).json({ message: 'Không có tệp nào được tải lên / No file uploaded' });
  }
};

// @desc    Upload banner image
// @route   POST /api/admin/banners/upload
// @access  Private/Admin
export const uploadBannerFile = async (req: AuthRequest, res: Response) => {
  if (req.file) {
    res.json({ 
      success: true,
      url: (req.file as any).path || (req.file as any).secure_url,
      message: 'Tải ảnh banner lên thành công / Banner image uploaded successfully'
    });
  } else {
    res.status(400).json({ message: 'Không có tệp nào được tải lên / No file uploaded' });
  }
};
