import { Router } from "express";
import * as C from "../controllers/room.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();
router.use(protect);

router.get("/search", C.searchRooms);
router.get("/created", C.getCreatedRooms);
router.post("/", C.createRoom);
router.post("/:id/join", C.joinRoom);
router.post("/secret", C.joinSecretRoomByName);
router.get("/", C.getUserRooms);
router.delete("/:id", C.deleteRoom);
router.patch("/:id", C.editRoom);
router.get("/:id", C.getRoomById);

export default router;
