const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: false
  },
  title: { type: String, required: true },
  image: { type: String, required: true },
  link: { type: String }, // Added to support external links
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Banner', bannerSchema);
