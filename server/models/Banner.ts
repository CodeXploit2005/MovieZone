import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBanner extends Document {
  movie?: mongoose.Types.ObjectId;
  title: string;
  image: string;
  link?: string;
  isActive: boolean;
  order: number;
}

const bannerSchema = new Schema<IBanner>({
  movie: {
    type: Schema.Types.ObjectId,
    ref: 'Movie',
    required: false
  },
  title: { type: String, required: true },
  image: { type: String, required: true },
  link: { type: String },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

const Banner: Model<IBanner> = mongoose.model<IBanner>('Banner', bannerSchema);
export default Banner;
