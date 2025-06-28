import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { getMessages, sendMessage } from "../controllers/message.controller";

const router = Router();

router.get("/:roomId", protect, getMessages);
router.post("/:roomId", protect, sendMessage);

export default router;
