"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadStoreImage = uploadStoreImage;
const cloudinary_1 = require("../config/cloudinary");
const STORE_IMAGE_FOLDER = 'storeverse/stores';
async function uploadStoreImage(buffer) {
    if (!cloudinary_1.isCloudinaryConfigured) {
        throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env');
    }
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.cloudinary.uploader.upload_stream({
            folder: STORE_IMAGE_FOLDER,
            resource_type: 'image',
        }, (error, result) => {
            if (error || !result?.secure_url) {
                reject(error ?? new Error('Cloudinary upload failed'));
                return;
            }
            resolve(result.secure_url);
        });
        uploadStream.end(buffer);
    });
}
