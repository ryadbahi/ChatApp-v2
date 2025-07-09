"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const message_controller_1 = require("../controllers/message.controller");
const router = (0, express_1.Router)();
// Room messages
router.get("/:roomId", auth_middleware_1.protect, message_controller_1.getMessages);
router.post("/:roomId", auth_middleware_1.protect, message_controller_1.sendMessage);
// Direct messages
router.get("/dm/threads", auth_middleware_1.protect, message_controller_1.getDMThreads);
router.get("/dm/:otherUserId", auth_middleware_1.protect, message_controller_1.getDirectMessages);
router.post("/dm/:otherUserId", auth_middleware_1.protect, message_controller_1.sendDirectMessage);
router.put("/dm/:otherUserId/read", auth_middleware_1.protect, message_controller_1.markDirectMessagesAsRead);
exports.default = router;
