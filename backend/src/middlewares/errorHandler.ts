import { Request, Response, NextFunction } from "express";
import multer from "multer";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ msg: "File too large. Max size is 1MB." });
      return;
    }
    res.status(400).json({ msg: err.message });
    return;
  }

  if (err.message === "INVALID_FILE_TYPE") {
    res
      .status(400)
      .json({ msg: "Only JPG, PNG, and WebP images are allowed." });
    return;
  }

  console.error("🔥 Unexpected error:", err);
  res.status(500).json({ msg: "Server error" });
};
