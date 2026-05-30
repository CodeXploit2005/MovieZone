import { Request, Response } from 'express';
import SupportMessage from '../models/SupportMessage';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Get support messages for the logged in user
// @route   GET /api/support
// @access  Private
export const getUserSupportMessages = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const messages = await SupportMessage.find({ user: (req.user as any)._id })
      .populate('sender', 'username avatar role')
      .sort({ createdAt: 1 as any });
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a support message from user
// @route   POST /api/support
// @access  Private
export const sendUserSupportMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const message = await SupportMessage.create({
      user: (req.user as any)._id,
      sender: (req.user as any)._id,
      content,
      isAdmin: false
    });

    const populatedMessage = await SupportMessage.findById((message as any)._id)
      .populate('sender', 'username avatar role');
    
    res.status(201).json(populatedMessage);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all conversations for admin
// @route   GET /api/support/admin/conversations
// @access  Private/Admin
export const getAdminConversations = async (req: Request, res: Response) => {
  try {
    // Get unique users who have sent support messages
    const users = await SupportMessage.distinct('user');
    
    const conversations = await Promise.all(users.map(async (userId) => {
      const lastMessage = await SupportMessage.findOne({ user: userId })
        .sort({ createdAt: -1 as any })
        .populate('user', 'username avatar email');
      
      if (!lastMessage) return null;

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

    // Filter out nulls and sort by latest message
    const filteredConversations = conversations.filter(c => c !== null);
    filteredConversations.sort((a, b) => (b!.lastMessageAt as any) - (a!.lastMessageAt as any));

    res.json(filteredConversations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get messages for a specific user conversation
// @route   GET /api/support/admin/:userId
// @access  Private/Admin
export const getAdminUserMessages = async (req: Request, res: Response) => {
  try {
    const messages = await SupportMessage.find({ user: req.params.userId })
      .populate('sender', 'username avatar role')
      .sort({ createdAt: 1 as any });

    // Mark as read
    await SupportMessage.updateMany(
      { user: req.params.userId, isAdmin: false, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin replies to a user
// @route   POST /api/support/admin/:userId
// @access  Private/Admin
export const adminReplySupportMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    const userId = req.params.userId as string;
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const message = await SupportMessage.create({
      user: userId,
      sender: (req.user as any)._id,
      content,
      isAdmin: true
    });

    const populatedMessage = await SupportMessage.findById((message as any)._id)
      .populate('sender', 'username avatar role');
    
    res.status(201).json(populatedMessage);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a support message
// @route   PUT /api/support/:id
// @access  Private
export const updateSupportMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const message = await SupportMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only allow sender to edit their own message
    if (message.sender.toString() !== (req.user as any)._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    const populatedMessage = await SupportMessage.findById((message as any)._id)
      .populate('sender', 'username avatar role');

    res.json(populatedMessage);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete (withdraw) a support message
// @route   DELETE /api/support/:id
// @access  Private
export const deleteSupportMessage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const message = await SupportMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only allow sender to delete their own message
    if (message.sender.toString() !== (req.user as any)._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await message.deleteOne();
    res.json({ success: true, message: 'Thành công! Tin nhắn đã được thu hồi. / Success! Message has been withdrawn.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete entire support conversation for a user
// @route   DELETE /api/support/admin/conversations/:userId
// @access  Private/Admin
export const deleteSupportConversation = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    await SupportMessage.deleteMany({ user: userId });
    res.json({ success: true, message: 'Thành công! Cuộc trò chuyện đã được xóa. / Success! Conversation has been deleted.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
