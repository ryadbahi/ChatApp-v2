import { Response } from "express";

export const sendError = (res: Response, status: number, msg: string): void => {
  res.status(status).json({ msg });
};
