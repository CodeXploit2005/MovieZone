import { v2 as cloudinary } from 'cloudinary';

console.log('--- CLOUDINARY CONFIG CHECK ---');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || 'MISSING');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'EXISTS' : 'MISSING');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'EXISTS' : 'MISSING');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

export default cloudinary;
