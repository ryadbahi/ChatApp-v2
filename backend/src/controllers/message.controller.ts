import { Request, Response } from "express";
import Message from "../models/Message";
import Room from "../models/Room";

// GET /api/messages/:roomId
export const getMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const roomId = req.params.roomId;

    if (!req.userId) {
      res.status(401).json({ msg: "Unauthorized" });
      return;
    }

    // ✅ TODO: Add pagination here if time allows (infinite scroll style)
    // Load messages in batches (e.g. limit 20), and fetch older ones using createdAt

    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404).json({ msg: "Room not found" });
      return;
    }

    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: 1 })
      .populate("sender", "username avatar");

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch messages" });
  }
};

export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { content, imageUrl } = req.body;
    const roomId = req.params.roomId;

    if (!req.userId) {
      res.status(401).json({ msg: "Unauthorized" });
      return;
    }

    if (!content && !imageUrl) {
      res.status(400).json({ msg: "Message must contain text or an image" });
      return;
    }

    const room = await Room.findById(roomId);

    if (!room) {
      res.status(404).json({ msg: "Room not found" });
      return;
    }

    // ✅ Create message
    const message = await Message.create({
      room: roomId,
      sender: req.userId,
      content,
      imageUrl,
    });

    const populated = await message.populate("sender", "username avatar");

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ msg: "Failed to send message" });
  }
};
