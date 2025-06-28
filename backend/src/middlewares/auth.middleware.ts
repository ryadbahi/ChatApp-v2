import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: string;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ msg: "Not authenticated" });
    return;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
  req.userId = decoded.id;
  next();
};
