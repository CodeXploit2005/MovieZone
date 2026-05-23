const mongoose = require('mongoose');

const adminMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null means group chat
  },
  content: {
    type: String,
    required: true
  },
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const AdminMessage = mongoose.model('AdminMessage', adminMessageSchema);

module.exports = AdminMessage;
