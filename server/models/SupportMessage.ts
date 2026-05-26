import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISupportMessage extends Document {
  user: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  isAdmin: boolean;
  isRead: boolean;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const supportMessageSchema = new Schema<ISupportMessage>({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User' // The user who is part of this support conversation
  },
  sender: {
    type: Schema.Types.ObjectId,
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

const SupportMessage: Model<ISupportMessage> = mongoose.model<ISupportMessage>('SupportMessage', supportMessageSchema);
export default SupportMessage;
