import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFavorite extends Document {
  user: mongoose.Types.ObjectId;
  movieId: string;
  movieTitle: string;
  posterPath: string;
  releaseDate?: string;
  voteAverage?: number;
}

const favoriteSchema = new Schema<IFavorite>(
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
    movieTitle: {
      type: String,
      required: true,
    },
    posterPath: {
      type: String,
      required: true,
    },
    releaseDate: {
      type: String,
    },
    voteAverage: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

const Favorite: Model<IFavorite> = mongoose.model<IFavorite>('Favorite', favoriteSchema);
export default Favorite;
