import {
  CreateRoomRequestBody,
  JoinRoomRequestBody,
} from "../types/room.types";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Room from "../models/Room";
import mongoose, { Types } from "mongoose";
import { IRoom } from "../models/Room";

// SEARCH ROOMS
export const searchRooms = async (
  req: Request<{}, {}, {}, { q: string }>,
  res: Response
): Promise<void> => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm) {
      res.status(400).json({ msg: "Search term is required" });
      return;
    }

    const rooms = await Room.find({
      name: { $regex: searchTerm, $options: "i" },
      visibility: { $in: ["public", "private"] }, // Don't include secret rooms in search
    })
      .select("-password")
      .populate("createdBy", "username");

    res.status(200).json(rooms);
  } catch (err) {
    console.error("[SEARCH ROOMS ERROR]", err);
    res.status(500).json({ msg: "Failed to search rooms" });
  }
};

// GET USER'S CREATED ROOMS
export const getCreatedRooms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ msg: "Unauthorized" });
      return;
    }

    const rooms = await Room.find({
      createdBy: new Types.ObjectId(req.userId),
    })
      .select("-password")
      .populate("createdBy", "username");

    res.status(200).json(rooms);
  } catch (err) {
    console.error("[GET CREATED ROOMS ERROR]", err);
    res.status(500).json({ msg: "Failed to fetch created rooms" });
  }
};

// Check if room name exists
const checkRoomNameExists = async (name: string): Promise<boolean> => {
  const room = await Room.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });
  return !!room;
};

// CREATE ROOM
export const createRoom = async (
  req: Request<{}, {}, CreateRoomRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const { name, visibility = "public", password } = req.body;

    if (!name) {
      res.status(400).json({ msg: "Room name is required." });
      return;
    }

    // Validate room name format
    const nameRegex = /^[a-zA-Z0-9-_\s]+$/;
    if (!nameRegex.test(name)) {
      res.status(400).json({
        msg: "Room name can only contain letters, numbers, spaces, hyphens and underscores",
      });
      return;
    }

    if (name.length < 3 || name.length > 30) {
      res.status(400).json({
        msg: "Room name must be between 3 and 30 characters",
      });
      return;
    }

    // Check for duplicate room name
    const exists = await checkRoomNameExists(name);
    if (exists) {
      res.status(400).json({ msg: "A room with this name already exists" });
      return;
    }

    if (!["public", "private", "secret"].includes(visibility)) {
      res.status(400).json({ msg: "Invalid visibility value." });
      return;
    }

    let hashedPassword: string | undefined;

    if (visibility !== "public") {
      if (!password || password.length < 4) {
        res.status(400).json({
          msg: "Password required for private or secret room (min 4 characters).",
        });
        return;
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    if (!req.userId) {
      res.status(401).json({ msg: "Unauthorized: userId missing." });
      return;
    }

    const room = await Room.create({
      name,
      visibility,
      password: hashedPassword,
      createdBy: req.userId,
    });

    res.status(201).json({
      id: room._id,
      name: room.name,
      visibility: room.visibility,
    });
  } catch (err) {
    console.error("[CREATE ROOM ERROR]", err);
    res.status(500).json({ msg: "Failed to create room." });
  }
};

// JOIN/ACCESS ROOM
export const joinRoom = async (
  req: Request<{ id: string }, {}, JoinRoomRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const roomId = req.params.id;
    const password = req.body?.password;
    const inputName = req.body?.name;

    if (!userId) {
      res.status(401).json({ msg: "Unauthorized" });
      return;
    }

    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404).json({ msg: "Room not found" });
      return;
    }

    // Check access based on visibility
    if (room.visibility === "private") {
      if (!password) {
        res.status(400).json({ msg: "Password required for private room" });
        return;
      }
      const match = await bcrypt.compare(password, room.password!);
      if (!match) {
        res.status(403).json({ msg: "Incorrect password" });
        return;
      }
    }

    if (room.visibility === "secret") {
      if (!password || !inputName) {
        res
          .status(400)
          .json({ msg: "Name and password required for secret room" });
        return;
      }
      const nameMatch = inputName === room.name;
      const pwdMatch = await bcrypt.compare(password, room.password!);
      if (!nameMatch || !pwdMatch) {
        res.status(403).json({ msg: "Invalid credentials for secret room" });
        return;
      }
    }

    res.status(200).json({
      id: room._id,
      name: room.name,
      visibility: room.visibility,
      createdBy: room.createdBy,
    });
  } catch (err) {
    console.error("[JOIN ROOM ERROR]", err);
    res.status(500).json({ msg: "Failed to join room" });
  }
};

// JOIN SECRET ROOM BY NAME (for frontend modal)
export const joinSecretRoomByName = async (
  req: Request<{}, {}, { name: string; password: string }>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { name, password } = req.body;
    if (!userId) {
      res.status(401).json({ msg: "Unauthorized" });
      return;
    }
    if (!name || !password) {
      res.status(400).json({ msg: "Name and password are required" });
      return;
    }
    const room = await Room.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      visibility: "secret",
    });
    if (!room) {
      res.status(403).json({ msg: "Invalid credentials for secret room" });
      return;
    }
    const pwdMatch = await bcrypt.compare(password, room.password!);
    if (!pwdMatch) {
      res.status(403).json({ msg: "Invalid credentials for secret room" });
      return;
    }
    res.status(200).json({
      id: room._id,
      name: room.name,
      visibility: room.visibility,
      createdBy: room.createdBy,
    });
  } catch (err) {
    console.error("[JOIN SECRET ROOM BY NAME ERROR]", err);
    res.status(500).json({ msg: "Failed to join secret room" });
  }
};

// GET VISIBLE ROOMS (public and private only)
export const getUserRooms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only fetch public and private rooms (secret rooms are hidden)
    const rooms = await Room.find({
      visibility: { $in: ["public", "private"] },
    })
      .select("-password")
      .populate("createdBy", "username");

    res.status(200).json(rooms);
  } catch (err) {
    console.error("[GET ROOMS ERROR]", err);
    res.status(500).json({ msg: "Failed to fetch rooms." });
  }
};

// GET ROOM BY ID
export const getRoomById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const room = await Room.findById(req.params.id)
      .populate("createdBy", "username")
      .select("-password"); // Don't send password hash

    if (!room) {
      res.status(404).json({ msg: "Room not found" });
      return;
    }

    res.status(200).json(room);
  } catch (err) {
    console.error("[getRoomById] Error:", err);
    res.status(500).json({ msg: "Failed to fetch room." });
  }
};

// DELETE ROOM (creator only)
export const deleteRoom = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const roomId = req.params.id;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ msg: "Unauthorized" });
      return;
    }

    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404).json({ msg: "Room not found" });
      return;
    }

    // Check if user is the creator
    if (room.createdBy.toString() !== new Types.ObjectId(userId).toString()) {
      res.status(403).json({ msg: "Only room creator can delete the room" });
      return;
    }

    await Room.findByIdAndDelete(roomId);
    res.status(200).json({ msg: "Room deleted successfully" });
  } catch (err) {
    console.error("[DELETE ROOM ERROR]", err);
    res.status(500).json({ msg: "Failed to delete room" });
  }
};

// EDIT ROOM (creator only)
export const editRoom = async (
  req: Request<{ id: string }, {}, CreateRoomRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const roomId = req.params.id;
    const userId = req.userId;
    const { name, visibility, password } = req.body;

    if (!userId) {
      res.status(401).json({ msg: "Unauthorized" });
      return;
    }

    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404).json({ msg: "Room not found" });
      return;
    }

    // Check if user is the creator
    if (room.createdBy.toString() !== new Types.ObjectId(userId).toString()) {
      res.status(403).json({ msg: "Only room creator can edit the room" });
      return;
    }

    // Validate visibility
    if (visibility && !["public", "private", "secret"].includes(visibility)) {
      res.status(400).json({ msg: "Invalid visibility value" });
      return;
    }

    // Handle password changes for private/secret rooms
    let hashedPassword = room.password;
    if (visibility && visibility !== "public") {
      if (!password && !room.password) {
        res.status(400).json({
          msg: "Password required for private or secret room (min 4 characters)",
        });
        return;
      }
      if (password) {
        if (password.length < 4) {
          res.status(400).json({
            msg: "Password must be at least 4 characters long",
          });
          return;
        }
        hashedPassword = await bcrypt.hash(password, 10);
      }
    }

    // Update room
    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      {
        ...(name && { name }),
        ...(visibility && { visibility }),
        ...(hashedPassword && { password: hashedPassword }),
      },
      { new: true }
    ).populate("createdBy", "username");

    res.status(200).json({
      id: updatedRoom?._id,
      name: updatedRoom?.name,
      visibility: updatedRoom?.visibility,
      createdBy: updatedRoom?.createdBy,
    });
  } catch (err) {
    console.error("[EDIT ROOM ERROR]", err);
    res.status(500).json({ msg: "Failed to edit room" });
  }
};
