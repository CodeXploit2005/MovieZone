const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');

const Favorite = require('../models/Favorite');
const Comment = require('../models/Comment');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    // Check if user is banned
    if (user.isBanned) {
      res.status(403);
      throw new Error('Tài khoản của bạn đã bị ban! Vui lòng liên hệ admin để được hỗ trợ.');
    }

    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      adminRequestStatus: user.adminRequestStatus,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  res.status(200).json(req.user);
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.avatar = req.body.avatar || user.avatar;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

// @desc    Upload user avatar
// @route   POST /api/auth/upload-avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  console.log('--- DEBUG UPLOAD AVATAR ---');
  console.log('req.file:', req.file);
  console.log('req.user:', req.user);
  console.log('Cloudinary Config:', {
    name: process.env.CLOUDINARY_CLOUD_NAME,
    key: process.env.CLOUDINARY_API_KEY ? 'EXISTS' : 'MISSING',
    secret: process.env.CLOUDINARY_API_SECRET ? 'EXISTS' : 'MISSING'
  });

  try {
    if (!req.file) {
      console.log('ERROR: No file in request');
      return res.status(400).json({ message: 'Please upload an image' });
    }

    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('ERROR: User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = req.file.path; // Cloudinary URL
    await user.save();

    console.log('SUCCESS: Avatar updated for user:', user.username);
    res.json({ 
      success: true, 
      avatar: user.avatar 
    });
  } catch (error) {
    console.log('CATCH ERROR:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Get user stats (favorites, comments, avg rating)
// @route   GET /api/auth/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const favoritesCount = await Favorite.countDocuments({ user: req.user._id });
    const userComments = await Comment.find({ user: req.user._id });
    
    const commentsCount = userComments.length;
    let avgRating = 0;
    
    if (commentsCount > 0) {
      const totalRating = userComments.reduce((sum, comment) => sum + (comment.rating || 0), 0);
      avgRating = (totalRating / commentsCount).toFixed(1);
    }

    res.json({
      favorites: favoritesCount,
      comments: commentsCount,
      avgRating
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user stats' });
  }
};

// @desc    Get user activity history (comments, likes, replies, watch history)
// @route   GET /api/auth/activity
// @access  Private
const getUserActivity = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Get comments made by user
    const comments = await Comment.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    // 2. Get comments user liked
    const likedComments = await Comment.find({ likes: userId })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    // 3. Get replies made by user
    // This is a bit tricky since replies are nested. 
    // We find comments where the user has a reply.
    const commentsWithUserReplies = await Comment.find({ 'replies.user': userId })
      .populate('user', 'username avatar')
      .sort({ updatedAt: -1 })
      .limit(20);

    // 4. Get watch history from User model
    const user = await User.findById(userId).select('watchHistory');

    res.json({
      comments,
      likedComments,
      replies: commentsWithUserReplies,
      watchHistory: user.watchHistory || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user activity' });
  }
};

// @desc    Add movie to watch history
// @route   POST /api/auth/watch-history
// @access  Private
const addToWatchHistory = async (req, res) => {
  try {
    const { movieId, title, posterPath } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove if already exists to move to top
    user.watchHistory = user.watchHistory.filter(item => item.movieId !== movieId);

    // Add to beginning of array
    user.watchHistory.unshift({
      movieId,
      title,
      posterPath,
      watchedAt: new Date()
    });

    // Limit to 50 items
    if (user.watchHistory.length > 50) {
      user.watchHistory = user.watchHistory.slice(0, 50);
    }

    await user.save();
    res.json({ success: true, watchHistory: user.watchHistory });
  } catch (error) {
    res.status(500).json({ message: 'Error updating watch history' });
  }
};

// @desc    Delete movie from watch history or clear all
// @route   DELETE /api/auth/watch-history/:movieId
// @access  Private
const deleteWatchHistory = async (req, res) => {
  try {
    const { movieId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (movieId === 'all') {
      user.watchHistory = [];
    } else {
      user.watchHistory = user.watchHistory.filter(item => item.movieId.toString() !== movieId);
    }

    await user.save();
    res.json({ success: true, watchHistory: user.watchHistory });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting watch history' });
  }
};

// @desc    Check if email exists and send OTP
// @route   POST /api/auth/check-email
// @access  Public
const checkEmailExists = async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  console.log('\x1b[36m%s\x1b[0m', '--- FORGOT PASSWORD DEBUG ---');
  console.log('1. Email input:', email);

  try {
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (user) {
      console.log('2. User found:', user.username);
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('3. Generated OTP:', otp);
      
      const emailData = {
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: {
          passcode: otp,
          username: user.username,
          user_email: email,
        }
      };

      try {
        console.log('4. Sending request to EmailJS...');
        const emailResponse = await axios.post('https://api.emailjs.com/api/v1.0/email/send', emailData, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('5. EmailJS Response:', emailResponse.data);
        
        return res.status(200).json({
          success: true,
          message: 'Mã OTP đã được gửi đến email của bạn',
          username: user.username,
          otp: otp
        });
      } catch (emailError) {
        console.error('5. EmailJS ERROR DETECTED:');
        if (emailError.response) {
          console.error('Status:', emailError.response.status);
          console.error('Data:', emailError.response.data);
        } else {
          console.error('Message:', emailError.message);
        }
        
        return res.status(500).json({ 
          success: false, 
          message: `Lỗi gửi Email: ${emailError.response?.data || emailError.message}` 
        });
      }
    } else {
      console.log('2. User NOT found for email:', email);
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống',
      });
    }
  } catch (error) {
    console.error('CRITICAL ERROR:', error);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi kiểm tra email' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  const { newPassword } = req.body;
  
  console.log('--- DEBUG FORGOT PASSWORD: RESET PASSWORD ---');
  console.log('Resetting password for email:', email);

  try {
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (user) {
      user.password = newPassword;
      await user.save();
      console.log('Password updated successfully for:', user.username);
      res.json({
        success: true,
        message: 'Mật khẩu đã được cập nhật thành công',
      });
    } else {
      console.log('User NOT found for reset password:', email);
      res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

// @desc    Request admin rights
// @route   POST /api/auth/request-admin
// @access  Private
const requestAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Bạn đã là Admin rồi' });
    }

    if (user.adminRequestStatus === 'pending') {
      return res.status(400).json({ message: 'Yêu cầu của bạn đang chờ được duyệt' });
    }

    user.adminRequestStatus = 'pending';
    await user.save();

    res.json({ success: true, message: 'Yêu cầu quyền Admin đã được gửi' });
  } catch (error) {
    res.status(500).json({ message: 'Error requesting admin rights' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  requestAdmin,
  getUserStats,
  getUserActivity,
  addToWatchHistory,
  deleteWatchHistory,
  checkEmailExists,
  resetPassword,
};
