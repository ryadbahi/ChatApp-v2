"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = void 0;
const cloudinary_1 = __importDefault(require("./cloudinary"));
const uploadToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        console.log("Starting upload to Cloudinary..."); // Debug log
        const stream = cloudinary_1.default.uploader.upload_stream({
            folder,
            resource_type: "image",
        }, (error, result) => {
            if (error) {
                console.error("Upload error:", error); // Debug log
                return reject(error);
            }
            if (!result) {
                console.error("No result returned from Cloudinary"); // Debug log
                return reject(new Error("No result returned from Cloudinary"));
            }
            console.log("Upload successful:", result.secure_url); // Debug log
            resolve({ secure_url: result.secure_url });
        });
        stream.end(fileBuffer);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
/*export const uploadToCloudinary = async (buffer: Buffer, folder = "chatapp") =>{
    return await cloudinary.uploader
    .upload_stream({ folder, resource_type: "auto" }, (error, result) => {
      if (error) throw error;
      return result;
    })
    .end(buffer);
}*/
