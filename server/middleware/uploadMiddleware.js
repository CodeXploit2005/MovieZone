const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const createStorage = (folder) => new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: folder,
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 1280, height: 720, crop: 'limit' }]
  },
});

const avatarUpload = multer({ storage: createStorage('moviezone_avatars') });
const movieUpload = multer({ storage: createStorage('moviezone_movies') });
const bannerUpload = multer({ storage: createStorage('moviezone_banners') });

module.exports = {
  avatarUpload,
  movieUpload,
  bannerUpload
};