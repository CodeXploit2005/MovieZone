const express = require('express');
const router = express.Router();
const {
  getUserSupportMessages,
  sendUserSupportMessage,
  getAdminConversations,
  getAdminUserMessages,
  adminReplySupportMessage,
  updateSupportMessage,
  deleteSupportMessage
} = require('../controllers/supportController');
const { protect, admin } = require('../middleware/authMiddleware');

// Common routes (User or Admin can edit/delete their own messages)
router.put('/:id', protect, updateSupportMessage);
router.delete('/:id', protect, deleteSupportMessage);

// User routes
router.get('/', protect, getUserSupportMessages);
router.post('/', protect, sendUserSupportMessage);

// Admin routes
router.get('/admin/conversations', protect, admin, getAdminConversations);
router.get('/admin/:userId', protect, admin, getAdminUserMessages);
router.post('/admin/:userId', protect, admin, adminReplySupportMessage);

module.exports = router;
