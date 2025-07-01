import {
  CreateRoomRequestBody,
  JoinRoomRequestBody,
} from "../types/room.types";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Room from "../models/Room";
import mongoose from "mongoose";

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
      members: [req.userId],
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

// JOIN ROOM
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

    await room.save();

    res.status(200).json({ msg: "Joined room successfully", roomId: room._id });
  } catch (err) {
    console.error("[JOIN ROOM ERROR]", err);
    res.status(500).json({ msg: "Failed to join room" });
  }
};

// GET VISIBLE ROOMS
export const getUserRooms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const rooms = await Room.find({
      $or: [{ visibility: "public" }, { visibility: "private" }],
    })
      .select("-password")
      .populate("createdBy", "username");

    res.status(200).json(rooms);
  } catch (err) {
    console.error("[GET ROOMS ERROR]", err);
    res.status(500).json({ msg: "Failed to fetch rooms." });
  }
};
// GET /api/rooms/:id
export const getRoomById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const room = await Room.findById(req.params.id).populate(
      "createdBy",
      "username"
    );
    if (!room) {
      res.status(404).json({ msg: "Room not found" });
      return;
    }

    // Vérifie que l'utilisateur est membre si la room est private ou secret
    if (room.visibility === "private" || room.visibility === "secret") {
    }

    res.status(200).json(room);
  } catch (err) {
    console.error("[getRoomById] Error:", err);
    res.status(500).json({ msg: "Failed to fetch room." });
  }
};
