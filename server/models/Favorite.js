const mongoose = require('mongoose');

const favoriteSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model('Favorite', favoriteSchema);
