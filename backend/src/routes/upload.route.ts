import express from "express";
import multer from "multer";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";

const router = express.Router();
const upload = multer(); // memory storage

router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const result = await uploadToCloudinary(req.file.buffer, "chatapp-media");
    res.json({ url: result.secure_url });
  } catch (err) {
    next(err);
  }
});

export default router;
