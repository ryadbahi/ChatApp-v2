import multer, { FileFilterCallback } from "multer";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error("INVALID_FILE_TYPE");
    cb(error);
  }
};

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
  fileFilter,
});
