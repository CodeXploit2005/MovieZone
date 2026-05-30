import express from 'express';
import {
  getUserSupportMessages,
  sendUserSupportMessage,
  getAdminConversations,
  getAdminUserMessages,
  adminReplySupportMessage,
  updateSupportMessage,
  deleteSupportMessage,
  deleteSupportConversation
} from '../controllers/supportController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// Common routes (User or Admin can edit/delete their own messages)
router.put('/:id', protect, updateSupportMessage);
router.delete('/:id', protect, deleteSupportMessage);

// User routes
router.get('/', protect, getUserSupportMessages);
router.post('/', protect, sendUserSupportMessage);

// Admin routes
router.get('/admin/conversations', protect, admin, getAdminConversations);
router.delete('/admin/conversations/:userId', protect, admin, deleteSupportConversation);
router.get('/admin/:userId', protect, admin, getAdminUserMessages);
router.post('/admin/:userId', protect, admin, adminReplySupportMessage);

export default router;
