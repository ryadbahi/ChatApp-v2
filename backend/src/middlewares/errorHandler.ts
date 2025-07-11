import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { AppError } from "../utils/AppError";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Multer errors (file upload)
  if (err instanceof multer.MulterError) {
    let message = err.message;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File too large. Max size is 1MB.";
    }
    res.status(400).json({
      success: false,
      error: { message, code: err.code || "UPLOAD_ERROR" },
    });
  }

  // Custom file type error
  if (err.message === "INVALID_FILE_TYPE") {
    res.status(400).json({
      success: false,
      error: {
        message: "Only JPG, PNG, and WebP images are allowed.",
        code: "INVALID_FILE_TYPE",
      },
    });
  }

  // Log error (add Sentry integration here for production)
  console.error(`[${new Date().toISOString()}]`, err);

  // Standardize error response, prevent sensitive info leaks
  const status = err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";
  const message = err.isOperational
    ? err.message
    : "An unexpected error occurred";

  res.status(status).json({
    success: false,
    error: { message, code },
  });
};
