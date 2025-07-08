import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import {
  signup,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  refreshToken,
} from "../controllers/auth.controller";
import { uploadImage } from "../middlewares/upload.middleware";
import { asyncHandler } from "../utils/asyncHandler"; // to remove ?

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.put("/profile", protect, uploadImage.single("avatar"), updateProfile);
router.put("/change-password", protect, changePassword);
router.post("/refresh", refreshToken);

export default router;
