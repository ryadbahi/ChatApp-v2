import {
  CreateRoomRequestBody,
  JoinRoomRequestBody,
} from "../types/room.types";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Room from "../models/Room";

export const createRoom = async (
  req: Request<{}, {}, CreateRoomRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const { name, isPrivate = false, password } = req.body;

    if (!name) {
      res.status(400).json({ msg: "Room name is required." });
      return;
    }

    let hashedPassword: string | undefined;

    if (isPrivate) {
      if (!password || password.length < 4) {
        res.status(400).json({
          msg: "Password required for private room (min 4 characters).",
        });
        return;
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Check before using
    if (!req.userId) {
      res.status(401).json({ msg: "Unauthorized: userId missing." });
      return;
    }

    const room = await Room.create({
      name,
      isPrivate,
      password: hashedPassword,
      createdBy: req.userId,
      members: [req.userId],
    });

    res.status(201).json({
      id: room._id,
      name: room.name,
      isPrivate: room.isPrivate,
    });
  } catch (err) {
    res.status(500).json({ msg: "Failed to create room." });
  }
};

export const joinRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = req.params.id;
    const { password } = req.body;

    console.log("[JOIN ROOM] Requested by user:", req.userId);
    console.log("[JOIN ROOM] Room ID:", roomId);

    if (!req.userId) {
      res.status(401).json({ msg: "Unauthorized" });
      return;
    }

    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404).json({ msg: "Room not found" });
      return;
    }

    console.log(
      "[JOIN ROOM] Room loaded:",
      room.name,
      "| isPrivate:",
      room.isPrivate
    );

    const alreadyMember = room.members.some((member) =>
      member.equals(req.userId)
    );
    console.log("[JOIN ROOM] Already a member?", alreadyMember);

    if (alreadyMember) {
      res.status(200).json({ msg: "Already a member", roomId: room._id });
      return;
    }

    if (room.isPrivate) {
      if (!password) {
        res.status(400).json({ msg: "Password is required for private room" });
        return;
      }

      const match = await bcrypt.compare(password, room.password!);
      if (!match) {
        res.status(403).json({ msg: "Incorrect password" });
        return;
      }
    }

    // ✅ Add user to room
    room.members.push(req.userId);
    await room.save();

    console.log("[JOIN ROOM] User added to room:", req.userId);

    res.status(200).json({ msg: "Joined room successfully", roomId: room._id });
  } catch (err) {
    console.error("[JOIN ROOM] Error:", err);
    res.status(500).json({ msg: "Failed to join room" });
  }
};

export const getUserRooms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const rooms = await Room.find({ members: req.userId })
      .select("-password")
      .populate("createdBy", "username");
    res.status(200).json(rooms);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch rooms." });
  }
};
