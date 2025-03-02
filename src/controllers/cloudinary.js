import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: '',
  api_key: 'your_api_key',
  api_secret: 'your_api_secret',
});

const uploadImage = async (file) => {
  const response = await cloudinary.uploader.upload(file, {
    folder: 'teachers_profiles', 
  });
  return response.secure_url;  
};