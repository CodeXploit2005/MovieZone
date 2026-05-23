const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');
const { movieUpload, bannerUpload } = require('../middleware/uploadMiddleware');

router.use(protect);
router.use(admin);

router.get('/requests', getAdminRequests);
router.patch('/approve-request/:userId', approveAdminRequest);

// Admin Chat
router.get('/chat', getAdminMessages);
router.post('/chat', sendAdminMessage);
router.delete('/chat/:id', deleteAdminMessage);
router.put('/chat/:id', updateAdminMessage);

router.get('/comments', getAllComments);
router.put('/comments/:id', updateComment);
router.delete('/comments/:id', deleteComment);
router.delete('/comments/:id/replies/:replyId', deleteReply);
router.put('/comments/:id/replies/:replyId', updateReply);
router.get('/stats', getStats);

// User actions
router.get('/users/admins', getAllAdmins);
router.patch('/users/:id/ban', toggleUserBan);
router.patch('/users/:id/role', updateUserRole);

// Movie & Banner management
router.post('/movies', addMovie);
router.put('/movies/:id', updateMovie);
router.post('/movies/upload', movieUpload.single('movie'), uploadMovieFile);
router.get('/movies', getAllMovies);
router.delete('/movies/:id', deleteMovie);
router.post('/banners', addBanner);
router.put('/banners/:id', updateBanner);
router.post('/banners/upload', bannerUpload.single('banner'), uploadBannerFile);
router.get('/banners', getAllBanners);
router.delete('/banners/:id', deleteBanner);

module.exports = router;
