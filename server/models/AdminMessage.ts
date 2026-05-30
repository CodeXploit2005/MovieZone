import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAdminMessage extends Document {
  user: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId | null;
  groupId: mongoose.Types.ObjectId | null;
  content: string;
  isEdited: boolean;
}

const adminMessageSchema = new Schema<IAdminMessage>({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null // null means group chat or custom group
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'AdminGroup',
    default: null
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

const AdminMessage: Model<IAdminMessage> = mongoose.model<IAdminMessage>('AdminMessage', adminMessageSchema);
export default AdminMessage;
