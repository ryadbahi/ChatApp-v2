"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const roomSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, "Room name must be at least 3 characters long"],
        maxlength: [15, "Room name cannot exceed 15 characters"],
        match: [
            /^[a-zA-Z0-9-_\s]+$/,
            "Room name can only contain letters, numbers, spaces, hyphens and underscores",
        ],
        index: true, // For faster searching
    },
    visibility: {
        type: String,
        enum: ["public", "private", "secret"],
        default: "public",
    },
    password: {
        type: String,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });
// Method to compare password
roomSchema.methods.comparePassword = async function (candidate) {
    if (!this.password)
        return false;
    return await bcryptjs_1.default.compare(candidate, this.password);
};
exports.default = (0, mongoose_1.model)("Room", roomSchema);
