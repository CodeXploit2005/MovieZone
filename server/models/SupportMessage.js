const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // The user who is part of this support conversation
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // The actual sender (can be the User or an Admin)
  },
  content: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false // Whether the sender is an admin replying
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema);

module.exports = SupportMessage;
