const express = require('express');
const router = express.Router();
const {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  likeComment,
  addReply,
  likeReply,
  deleteReply,
  reportComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:movieId', getComments);
router.post('/', protect, addComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, likeComment);
router.post('/:id/reply', protect, addReply);
router.post('/:id/reply/:replyId/like', protect, likeReply);
router.delete('/:id/reply/:replyId', protect, deleteReply);
router.post('/:id/report', protect, reportComment);

module.exports = router;
