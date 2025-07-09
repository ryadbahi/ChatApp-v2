"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoomById = exports.editRoom = exports.deleteRoom = exports.getUserRooms = exports.joinSecretRoomByName = exports.joinRoom = exports.createRoom = exports.getCreatedRooms = exports.searchRooms = void 0;
const Room_1 = __importDefault(require("../models/Room"));
const mongoose_1 = require("mongoose");
const room_utils_1 = require("../utils/room.utils");
const error_utils_1 = require("../utils/error.utils");
// SEARCH
const searchRooms = async (req, res) => {
    const q = req.query.q;
    if (!q)
        return (0, error_utils_1.sendError)(res, 400, "Search term is required");
    const rooms = await Room_1.default.find({
        name: { $regex: q, $options: "i" },
        visibility: { $in: ["public", "private"] },
    })
        .select("-password")
        .populate("createdBy", "username");
    res.json(rooms);
};
exports.searchRooms = searchRooms;
// CREATED
const getCreatedRooms = async (req, res) => {
    const uid = req.userId?.toString();
    if (!uid)
        return (0, error_utils_1.sendError)(res, 401, "Unauthorized");
    const rooms = await Room_1.default.find({ createdBy: uid })
        .select("-password")
        .populate("createdBy", "username");
    res.json(rooms);
};
exports.getCreatedRooms = getCreatedRooms;
// CREATE
const createRoom = async (req, res) => {
    const uid = req.userId?.toString();
    if (!uid)
        return (0, error_utils_1.sendError)(res, 401, "Unauthorized");
    const { name, visibility = "public", password } = req.body;
    if (!name)
        return (0, error_utils_1.sendError)(res, 400, "Room name required");
    if (!(0, room_utils_1.validateRoomName)(name))
        return (0, error_utils_1.sendError)(res, 400, "Name: 3‑30 chars; letters, numbers, spaces, - _ only");
    if (await (0, room_utils_1.checkRoomNameExists)(name))
        return (0, error_utils_1.sendError)(res, 400, "Room name already exists");
    if (!(0, room_utils_1.validateVisibility)(visibility))
        return (0, error_utils_1.sendError)(res, 400, "Invalid visibility");
    let pwHash;
    if (visibility !== "public") {
        if (!password || password.length < 4)
            return (0, error_utils_1.sendError)(res, 400, "Password min 4 chars required");
        pwHash = await (0, room_utils_1.hashPassword)(password);
    }
    const room = await Room_1.default.create({
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
exports.createRoom = createRoom;
// JOIN
const joinRoom = async (req, res) => {
    const uid = req.userId?.toString();
    if (!uid)
        return (0, error_utils_1.sendError)(res, 401, "Unauthorized");
    const room = await Room_1.default.findById(req.params.id);
    if (!room)
        return (0, error_utils_1.sendError)(res, 404, "Room not found");
    // Check if user is the creator - creators can always access their own rooms
    const isCreator = room.createdBy.toString() === uid;
    if (room.visibility === "private" && !isCreator) {
        const { password } = req.body;
        if (!password)
            return (0, error_utils_1.sendError)(res, 400, "Password required for private room");
        if (!(await (0, room_utils_1.comparePassword)(password, room.password)))
            return (0, error_utils_1.sendError)(res, 403, "Incorrect password");
    }
    if (room.visibility === "secret" && !isCreator) {
        const { password, name } = req.body;
        if (!name || !password)
            return (0, error_utils_1.sendError)(res, 400, "Name & password required for secret room");
        if (name !== room.name ||
            !(await (0, room_utils_1.comparePassword)(password, room.password)))
            return (0, error_utils_1.sendError)(res, 403, "Invalid credentials");
    }
    res.json({
        id: room._id,
        name: room.name,
        visibility: room.visibility,
        createdBy: room.createdBy,
    });
};
exports.joinRoom = joinRoom;
// SECRET BY NAME
const joinSecretRoomByName = async (req, res) => {
    const uid = req.userId?.toString();
    if (!uid)
        return (0, error_utils_1.sendError)(res, 401, "Unauthorized");
    const { name, password } = req.body;
    if (!name || !password)
        return (0, error_utils_1.sendError)(res, 400, "Name and password required");
    const room = await Room_1.default.findOne({
        name: { $regex: `^${name}$`, $options: "i" },
        visibility: "secret",
    });
    if (!room)
        return (0, error_utils_1.sendError)(res, 403, "Invalid credentials");
    if (!(await (0, room_utils_1.comparePassword)(password, room.password)))
        return (0, error_utils_1.sendError)(res, 403, "Invalid credentials");
    res.json({
        id: room._id,
        name: room.name,
        visibility: room.visibility,
        createdBy: room.createdBy,
    });
};
exports.joinSecretRoomByName = joinSecretRoomByName;
// VISIBLE
const getUserRooms = async (_req, res) => {
    const rooms = await Room_1.default.find({
        visibility: { $in: ["public", "private"] },
    })
        .select("-password")
        .populate("createdBy", "username");
    res.json(rooms);
};
exports.getUserRooms = getUserRooms;
// DELETE
const deleteRoom = async (req, res) => {
    const uid = req.userId?.toString();
    if (!uid)
        return (0, error_utils_1.sendError)(res, 401, "Unauthorized");
    const room = await Room_1.default.findById(req.params.id);
    if (!room)
        return (0, error_utils_1.sendError)(res, 404, "Room not found");
    if (!(0, room_utils_1.isRoomCreator)(room, uid))
        return (0, error_utils_1.sendError)(res, 403, "Only creator can delete");
    await room.deleteOne();
    res.json({ msg: "Deleted successfully" });
};
exports.deleteRoom = deleteRoom;
// EDIT
const editRoom = async (req, res) => {
    const uid = req.userId?.toString();
    if (!uid)
        return (0, error_utils_1.sendError)(res, 401, "Unauthorized");
    const room = await Room_1.default.findById(req.params.id);
    if (!room)
        return (0, error_utils_1.sendError)(res, 404, "Room not found");
    if (!(0, room_utils_1.isRoomCreator)(room, uid))
        return (0, error_utils_1.sendError)(res, 403, "Only creator can edit");
    const updates = {};
    const { name, visibility, password } = req.body;
    if (name) {
        if (!(0, room_utils_1.validateRoomName)(name))
            return (0, error_utils_1.sendError)(res, 400, "Invalid room name");
        if ((await (0, room_utils_1.checkRoomNameExists)(name)) && name !== room.name)
            return (0, error_utils_1.sendError)(res, 400, "Room name exists");
        updates.name = name;
    }
    if (visibility) {
        if (!(0, room_utils_1.validateVisibility)(visibility))
            return (0, error_utils_1.sendError)(res, 400, "Invalid visibility");
        updates.visibility = visibility;
    }
    if (visibility && visibility !== "public") {
        if (!password && !room.password)
            return (0, error_utils_1.sendError)(res, 400, "Password required");
        if (password && password.length < 4)
            return (0, error_utils_1.sendError)(res, 400, "Password min 4 chars");
        if (password)
            updates.password = await (0, room_utils_1.hashPassword)(password);
    }
    else if (visibility === "public") {
        updates.password = undefined;
    }
    const updated = await Room_1.default.findByIdAndUpdate(req.params.id, updates, {
        new: true,
    })
        .select("-password")
        .populate("createdBy", "username");
    res.json(updated);
};
exports.editRoom = editRoom;
const getRoomById = async (req, res) => {
    const roomId = req.params.id;
    if (!mongoose_1.Types.ObjectId.isValid(roomId)) {
        return (0, error_utils_1.sendError)(res, 400, "Invalid room ID");
    }
    const room = await Room_1.default.findById(roomId)
        .select("-password")
        .populate("createdBy", "username");
    if (!room) {
        return (0, error_utils_1.sendError)(res, 404, "Room not found");
    }
    res.json(room);
};
exports.getRoomById = getRoomById;
