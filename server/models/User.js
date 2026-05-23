const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please add a username'],
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    avatar: {
      type: String,
      default: 'https://i.pravatar.cc/150?u=moviezone',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    adminRequestStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    favorites: [
      {
        type: String,
      }
    ],
    watchHistory: [
      {
        movieId: { type: String, required: true },
        title: { type: String },
        posterPath: { type: String },
        watchedAt: { type: Date, default: Date.now }
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
