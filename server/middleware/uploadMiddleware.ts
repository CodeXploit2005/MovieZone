import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

const createStorage = (folder: string) => new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: folder,
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 1280, height: 720, crop: 'limit' }]
  } as any,
});

const avatarUpload = multer({ storage: createStorage('moviezone_avatars') });
const movieUpload = multer({ storage: createStorage('moviezone_movies') });
const bannerUpload = multer({ storage: createStorage('moviezone_banners') });

export {
  avatarUpload,
  movieUpload,
  bannerUpload
};
