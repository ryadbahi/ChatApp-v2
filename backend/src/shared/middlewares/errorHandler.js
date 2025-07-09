"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const multer_1 = __importDefault(require("multer"));
const errorHandler = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({ msg: "File too large. Max size is 1MB." });
            return;
        }
        res.status(400).json({ msg: err.message });
        return;
    }
    if (err.message === "INVALID_FILE_TYPE") {
        res
            .status(400)
            .json({ msg: "Only JPG, PNG, and WebP images are allowed." });
        return;
    }
    console.error("🔥 Unexpected error:", err);
    res.status(500).json({ msg: "Server error" });
};
exports.errorHandler = errorHandler;
