import Room, { IRoom } from "../models/Room";
import bcrypt from "bcryptjs";

export const validateRoomName = (name: string): boolean =>
  /^[a-zA-Z0-9-_\s]+$/.test(name) && name.length >= 3 && name.length <= 30;

export const validateVisibility = (v: any): v is IRoom["visibility"] =>
  ["public", "private", "secret"].includes(v);

export const checkRoomNameExists = async (name: string): Promise<boolean> =>
  (await Room.exists({ name: { $regex: `^${name}$`, $options: "i" } })) !==
  null;

export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, 10);

export const comparePassword = (
  plain: string,
  hash: string
): Promise<boolean> => bcrypt.compare(plain, hash);

export const isRoomCreator = (room: IRoom, userId: string): boolean =>
  room.createdBy.toString() === userId;
