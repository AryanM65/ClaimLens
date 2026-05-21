import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer directly to Cloudinary using a stream.
 * Works seamlessly with Multer's memory storage to bypass disk writes.
 * 
 * @param {Buffer} fileBuffer - The buffer of the file (req.file.buffer)
 * @param {string} [folder] - The target folder inside Cloudinary
 * @returns {Promise<object>} The Cloudinary upload response object
 */
export const uploadToCloudinary = (fileBuffer, folder = "claimlens") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          console.error("[Cloudinary Stream Upload Error]:", error);
          return reject(error);
        }
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
