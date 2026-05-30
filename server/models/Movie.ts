import mongoose, { Document, Model } from 'mongoose';

export interface IMovie extends Document {
  tmdbId?: string;
  title: string;
  description?: string;
  posterPath?: string;
  backdropPath?: string;
  trailerUrl?: string;
  releaseDate?: string;
  runtime?: string;
  country?: string;
  voteAverage?: number;
  genres: string[];
  views: number;
  likes: number;
}

const movieSchema = new mongoose.Schema<IMovie>({
  tmdbId: { type: String, unique: true, sparse: true },
  title: { type: String, required: true },
  description: { type: String },
  posterPath: { type: String },
  backdropPath: { type: String },
  trailerUrl: { type: String },
  releaseDate: { type: String },
  runtime: { type: String },
  country: { type: String },
  voteAverage: { type: Number },
  genres: [String],
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 }
}, {
  timestamps: true
});

const Movie: Model<IMovie> = mongoose.model<IMovie>('Movie', movieSchema);
export default Movie;
