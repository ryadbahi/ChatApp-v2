import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ msg: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    // Convert string id to ObjectId before assigning
    req.userId = new (require("mongoose").Types.ObjectId)(decoded.id);

    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
};
