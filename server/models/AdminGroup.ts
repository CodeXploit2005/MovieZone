import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAdminGroup extends Document {
  name: string;
  members: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
}

const adminGroupSchema = new Schema<IAdminGroup>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const AdminGroup: Model<IAdminGroup> = mongoose.model<IAdminGroup>('AdminGroup', adminGroupSchema);
export default AdminGroup;
