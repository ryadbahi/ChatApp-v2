import { Request, Response } from "express";
import Room, { IRoom } from "../models/Room";
import { Types } from "mongoose";
import {
  validateRoomName,
  validateVisibility,
  checkRoomNameExists,
  hashPassword,
  comparePassword,
  isRoomCreator,
} from "../utils/room.utils";
import { sendError } from "../utils/error.utils";

// SEARCH
export const searchRooms = async (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q) return sendError(res, 400, "Search term is required");

  const rooms = await Room.find({
    name: { $regex: q, $options: "i" },
    visibility: { $in: ["public", "private"] },
  })
    .select("-password")
    .populate("createdBy", "username");
  res.json(rooms);
};

// CREATED
export const getCreatedRooms = async (req: Request, res: Response) => {
  const uid = req.userId?.toString();
  if (!uid) return sendError(res, 401, "Unauthorized");

  const rooms = await Room.find({ createdBy: uid })
    .select("-password")
    .populate("createdBy", "username");
  res.json(rooms);
};

// CREATE
export const createRoom = async (req: Request, res: Response) => {
  const uid = req.userId?.toString();
  if (!uid) return sendError(res, 401, "Unauthorized");

  const { name, visibility = "public", password } = req.body;
  if (!name) return sendError(res, 400, "Room name required");
  if (!validateRoomName(name))
    return sendError(
      res,
      400,
      "Name: 3‑30 chars; letters, numbers, spaces, - _ only"
    );
  if (await checkRoomNameExists(name))
    return sendError(res, 400, "Room name already exists");

  if (!validateVisibility(visibility))
    return sendError(res, 400, "Invalid visibility");

  let pwHash: string | undefined;
  if (visibility !== "public") {
    if (!password || password.length < 4)
      return sendError(res, 400, "Password min 4 chars required");
    pwHash = await hashPassword(password);
  }

  const room = await Room.create({
    name,
    visibility,
    password: pwHash,
    createdBy: uid,
  });
  res.status(201).json({
    id: room._id,
    name: room.name,
    visibility: room.visibility,
  });
};

// JOIN
export const joinRoom = async (req: Request<{ id: string }>, res: Response) => {
  const uid = req.userId?.toString();
  if (!uid) return sendError(res, 401, "Unauthorized");

  const room = await Room.findById(req.params.id);
  if (!room) return sendError(res, 404, "Room not found");

  // Check if user is the creator - creators can always access their own rooms
  const isCreator = room.createdBy.toString() === uid;

  if (room.visibility === "private" && !isCreator) {
    const { password } = req.body;
    if (!password)
      return sendError(res, 400, "Password required for private room");
    if (!(await comparePassword(password, room.password!)))
      return sendError(res, 403, "Incorrect password");
  }

  if (room.visibility === "secret" && !isCreator) {
    const { password, name } = req.body;
    if (!name || !password)
      return sendError(res, 400, "Name & password required for secret room");
    if (
      name !== room.name ||
      !(await comparePassword(password, room.password!))
    )
      return sendError(res, 403, "Invalid credentials");
  }

  res.json({
    id: room._id,
    name: room.name,
    visibility: room.visibility,
    createdBy: room.createdBy,
  });
};

// SECRET BY NAME
export const joinSecretRoomByName = async (req: Request, res: Response) => {
  const uid = req.userId?.toString();
  if (!uid) return sendError(res, 401, "Unauthorized");

  const { name, password } = req.body;
  if (!name || !password)
    return sendError(res, 400, "Name and password required");

  const room = await Room.findOne({
    name: { $regex: `^${name}$`, $options: "i" },
    visibility: "secret",
  });
  if (!room) return sendError(res, 403, "Invalid credentials");
  if (!(await comparePassword(password, room.password!)))
    return sendError(res, 403, "Invalid credentials");

  res.json({
    id: room._id,
    name: room.name,
    visibility: room.visibility,
    createdBy: room.createdBy,
  });
};

// VISIBLE
export const getUserRooms = async (_req: Request, res: Response) => {
  const rooms = await Room.find({
    visibility: { $in: ["public", "private"] },
  })
    .select("-password")
    .populate("createdBy", "username");
  res.json(rooms);
};

// DELETE
export const deleteRoom = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const uid = req.userId?.toString();
  if (!uid) return sendError(res, 401, "Unauthorized");

  const room = await Room.findById(req.params.id);
  if (!room) return sendError(res, 404, "Room not found");
  if (!isRoomCreator(room, uid))
    return sendError(res, 403, "Only creator can delete");

  await room.deleteOne();
  res.json({ msg: "Deleted successfully" });
};

// EDIT
export const editRoom = async (req: Request<{ id: string }>, res: Response) => {
  const uid = req.userId?.toString();
  if (!uid) return sendError(res, 401, "Unauthorized");

  const room = await Room.findById(req.params.id);
  if (!room) return sendError(res, 404, "Room not found");
  if (!isRoomCreator(room, uid))
    return sendError(res, 403, "Only creator can edit");

  const updates: Partial<IRoom> = {};
  const { name, visibility, password } = req.body;

  if (name) {
    if (!validateRoomName(name))
      return sendError(res, 400, "Invalid room name");
    if ((await checkRoomNameExists(name)) && name !== room.name)
      return sendError(res, 400, "Room name exists");
    updates.name = name;
  }

  if (visibility) {
    if (!validateVisibility(visibility))
      return sendError(res, 400, "Invalid visibility");
    updates.visibility = visibility;
  }

  if (visibility && visibility !== "public") {
    if (!password && !room.password)
      return sendError(res, 400, "Password required");
    if (password && password.length < 4)
      return sendError(res, 400, "Password min 4 chars");
    if (password) updates.password = await hashPassword(password);
  } else if (visibility === "public") {
    updates.password = undefined;
  }

  const updated = await Room.findByIdAndUpdate(req.params.id, updates, {
    new: true,
  })
    .select("-password")
    .populate("createdBy", "username");
  res.json(updated);
};
