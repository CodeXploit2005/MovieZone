const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { avatarUpload } = require('../middleware/uploadMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/check-email', checkEmailExists);
router.post('/reset-password', resetPassword);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.get('/stats', protect, getUserStats);
router.get('/activity', protect, getUserActivity);
router.post('/watch-history', protect, addToWatchHistory);
router.delete('/watch-history/:movieId', protect, deleteWatchHistory);
router.post('/upload-avatar', protect, avatarUpload.single('avatar'), uploadAvatar);
router.post('/request-admin', protect, requestAdmin);

module.exports = router;
