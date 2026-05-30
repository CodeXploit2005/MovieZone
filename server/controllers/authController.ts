import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '../models/User';
import Favorite from '../models/Favorite';
import Comment from '../models/Comment';
import { AuthRequest } from '../middleware/authMiddleware';

// Generate JWT
const generateToken = (id: any) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin / Please add all fields' });
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'Email đã được sử dụng / Email already exists' });
  }

  const usernameExists = await User.findOne({ username });
  if (usernameExists) {
    return res.status(400).json({ message: 'Tên đăng nhập đã được sử dụng / Username already exists' });
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
      message: 'Đăng ký thành công / Registration successful'
    });
  } else {
    res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ / Invalid user data' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa / Your account has been banned' });
    }

    // Update last login
    (user as any).lastLogin = new Date();
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      adminRequestStatus: user.adminRequestStatus,
      token: generateToken(user._id),
      message: 'Đăng nhập thành công / Login successful'
    });
  } else {
    res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác / Invalid email or password' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  res.status(200).json(req.user);
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  
  const user = await User.findById((req.user as any)._id);

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
      message: 'Cập nhật hồ sơ thành công / Profile updated successfully'
    });
  } else {
    res.status(404).json({ message: 'Không tìm thấy người dùng / User not found' });
  }
};

// @desc    Upload user avatar
// @route   POST /api/auth/upload-avatar
// @access  Private
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
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
      return res.status(400).json({ message: 'Vui lòng chọn một hình ảnh / Please upload an image' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Bạn không có quyền thực hiện hành động này / Not authorized' });
    }

    const userId = (req.user as any)._id;
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('ERROR: User not found with ID:', userId);
      return res.status(404).json({ message: 'Người dùng không tồn tại / User not found' });
    }

    user.avatar = (req.file as any).path || (req.file as any).secure_url; // Use path or secure_url
    await user.save();

    console.log('SUCCESS: Avatar updated for user:', user.username);
    res.json({ 
      success: true, 
      avatar: user.avatar,
      message: 'Cập nhật ảnh đại diện thành công / Avatar updated successfully'
    });
  } catch (error: any) {
    console.error('--- UPLOAD AVATAR ERROR ---');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// @desc    Get user stats (favorites, comments, avg rating)
// @route   GET /api/auth/stats
// @access  Private
export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const favoritesCount = await Favorite.countDocuments({ user: (req.user as any)._id });
    const userComments = await Comment.find({ user: (req.user as any)._id });
    
    const commentsCount = userComments.length;
    let avgRating: string | number = 0;
    
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
export const getUserActivity = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const userId = (req.user as any)._id;

    // 1. Get comments made by user
    const comments = await Comment.find({ user: userId })
      .sort({ createdAt: -1 as any })
      .limit(20);

    // 2. Get comments user liked
    const likedComments = await Comment.find({ likes: userId })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 as any })
      .limit(20);

    // 3. Get replies made by user
    const commentsWithUserReplies = await Comment.find({ 'replies.user': userId })
      .populate('user', 'username avatar')
      .sort({ updatedAt: -1 as any })
      .limit(20);

    // 4. Get watch history from User model
    const user = await User.findById(userId).select('watchHistory');

    res.json({
      comments,
      likedComments,
      replies: commentsWithUserReplies,
      watchHistory: user?.watchHistory || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user activity' });
  }
};

// @desc    Add movie to watch history
// @route   POST /api/auth/watch-history
// @access  Private
export const addToWatchHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { movieId, title, posterPath } = req.body;
    const user = await User.findById((req.user as any)._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove if already exists to move to top
    if (user.watchHistory) {
      user.watchHistory = user.watchHistory.filter(item => item.movieId !== movieId);
    } else {
      user.watchHistory = [];
    }

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
export const deleteWatchHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { movieId } = req.params;
    const user = await User.findById((req.user as any)._id);

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
export const checkEmailExists = async (req: Request, res: Response) => {
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
          message: 'Thành công! Mã OTP đã được gửi đến email của bạn. / Success! OTP code has been sent to your email.',
          username: user.username,
          otp: otp
        });
      } catch (emailError: any) {
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
export const resetPassword = async (req: Request, res: Response) => {
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
        message: 'Thành công! Mật khẩu của bạn đã được cập nhật. / Success! Your password has been updated.',
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
export const requestAdmin = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const user = await User.findById((req.user as any)._id);

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

    res.json({ success: true, message: 'Thành công! Yêu cầu quyền Admin đã được gửi và đang chờ duyệt. / Success! Admin rights request has been sent and is pending approval.' });
  } catch (error) {
    res.status(500).json({ message: 'Error requesting admin rights' });
  }
};
