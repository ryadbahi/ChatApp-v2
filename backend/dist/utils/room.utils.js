"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRoomCreator = exports.comparePassword = exports.hashPassword = exports.checkRoomNameExists = exports.validateVisibility = exports.validateRoomName = void 0;
const Room_1 = __importDefault(require("../models/Room"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const validateRoomName = (name) => /^[a-zA-Z0-9-_\s]+$/.test(name) && name.length >= 3 && name.length <= 30;
exports.validateRoomName = validateRoomName;
const validateVisibility = (v) => ["public", "private", "secret"].includes(v);
exports.validateVisibility = validateVisibility;
const checkRoomNameExists = async (name) => (await Room_1.default.exists({ name: { $regex: `^${name}$`, $options: "i" } })) !==
    null;
exports.checkRoomNameExists = checkRoomNameExists;
const hashPassword = (plain) => bcryptjs_1.default.hash(plain, 10);
exports.hashPassword = hashPassword;
const comparePassword = (plain, hash) => bcryptjs_1.default.compare(plain, hash);
exports.comparePassword = comparePassword;
const isRoomCreator = (room, userId) => room.createdBy.toString() === userId;
exports.isRoomCreator = isRoomCreator;
