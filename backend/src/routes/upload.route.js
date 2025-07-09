"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const uploadToCloudinary_1 = require("../utils/uploadToCloudinary");
const router = express_1.default.Router();
const upload = (0, multer_1.default)(); // memory storage
router.post("/", upload.single("file"), async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }
        const result = await (0, uploadToCloudinary_1.uploadToCloudinary)(req.file.buffer, "chatapp-media");
        res.json({ url: result.secure_url });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
