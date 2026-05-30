import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReply {
  user: mongoose.Types.ObjectId;
  content: string;
  replyToUser?: string;
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
}

export interface IReport {
  user: mongoose.Types.ObjectId;
  reason?: string;
  createdAt: Date;
}

export interface IComment extends Document {
  user: mongoose.Types.ObjectId;
  movieId: string;
  content: string;
  rating: number;
  likes: mongoose.Types.ObjectId[];
  replies: IReply[];
  reports: IReport[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    movieId: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Please add some content'],
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    replies: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        replyToUser: {
          type: String,
        },
        likes: [
          {
            type: Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reports: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        reason: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Comment: Model<IComment> = mongoose.model<IComment>('Comment', commentSchema);
export default Comment;
