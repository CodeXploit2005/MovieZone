const SupportMessage = require('../models/SupportMessage');
const User = require('../models/User');

// @desc    Get support messages for the logged in user
// @route   GET /api/support
// @access  Private
const getUserSupportMessages = async (req, res) => {
  try {
    const messages = await SupportMessage.find({ user: req.user._id })
      .populate('sender', 'username avatar role')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a support message from user
// @route   POST /api/support
// @access  Private
const sendUserSupportMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const message = await SupportMessage.create({
      user: req.user._id,
      sender: req.user._id,
      content,
      isAdmin: false
    });

    const populatedMessage = await SupportMessage.findById(message._id)
      .populate('sender', 'username avatar role');
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all conversations for admin
// @route   GET /api/support/admin/conversations
// @access  Private/Admin
const getAdminConversations = async (req, res) => {
  try {
    // Get unique users who have sent support messages
    const users = await SupportMessage.distinct('user');
    
    const conversations = await Promise.all(users.map(async (userId) => {
      const lastMessage = await SupportMessage.findOne({ user: userId })
        .sort({ createdAt: -1 })
        .populate('user', 'username avatar email');
      
      const unreadCount = await SupportMessage.countDocuments({ 
        user: userId, 
        isAdmin: false, 
        isRead: false 
      });

      return {
        user: lastMessage.user,
        lastMessage: lastMessage.content,
        lastMessageAt: lastMessage.createdAt,
        unreadCount
      };
    }));

    // Sort by latest message
    conversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get messages for a specific user conversation
// @route   GET /api/support/admin/:userId
// @access  Private/Admin
const getAdminUserMessages = async (req, res) => {
  try {
    const messages = await SupportMessage.find({ user: req.params.userId })
      .populate('sender', 'username avatar role')
      .sort({ createdAt: 1 });

    // Mark as read
    await SupportMessage.updateMany(
      { user: req.params.userId, isAdmin: false, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin replies to a user
// @route   POST /api/support/admin/:userId
// @access  Private/Admin
const adminReplySupportMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const message = await SupportMessage.create({
      user: req.params.userId,
      sender: req.user._id,
      content,
      isAdmin: true
    });

    const populatedMessage = await SupportMessage.findById(message._id)
      .populate('sender', 'username avatar role');
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a support message
// @route   PUT /api/support/:id
// @access  Private
const updateSupportMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const message = await SupportMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only allow sender to edit their own message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    const populatedMessage = await SupportMessage.findById(message._id)
      .populate('sender', 'username avatar role');

    res.json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete (withdraw) a support message
// @route   DELETE /api/support/:id
// @access  Private
const deleteSupportMessage = async (req, res) => {
  try {
    const message = await SupportMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only allow sender to delete their own message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await message.deleteOne();
    res.json({ message: 'Message withdrawn' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserSupportMessages,
  sendUserSupportMessage,
  getAdminConversations,
  getAdminUserMessages,
  adminReplySupportMessage,
  updateSupportMessage,
  deleteSupportMessage
};
