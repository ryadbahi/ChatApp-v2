import rateLimit from "express-rate-limit";
import { NextFunction, Request, Response } from "express";

// Rate limiter for join attempts
export const joinRoomLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 join attempts per windowMs
  message: {
    msg: "Too many join attempts from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
