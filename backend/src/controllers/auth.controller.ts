import { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AuthResponse, AuthenticatedUser } from "../types/responses";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import RefreshToken from "../models/RefreshToken";

const createToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
};

const createAccessToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: "15m" });
};

const createRefreshToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" });
};

export const signup = async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "Email already used" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });

    const accessToken = createAccessToken(user._id.toString());
    const refreshToken = createRefreshToken(user._id.toString());
    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return res
      .cookie("token", accessToken, {
        httpOnly: true,
        secure: false,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(201)
      .json({
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        },
      });
  } catch (err) {
    return res.status(500).json({ msg: "Signup error" });
  }
};

export const login = async (
  req: Request,
  res: Response<AuthResponse>
): Promise<any> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const accessToken = createAccessToken(user._id.toString());
    const refreshToken = createRefreshToken(user._id.toString());
    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return res
      .cookie("token", accessToken, {
        httpOnly: true,
        secure: false,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        },
      });
  } catch (err) {
    return res.status(500).json({ msg: "Login error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  // Supprime tous les refresh tokens de l'utilisateur
  if (req.userId) {
    await RefreshToken.deleteMany({ user: req.userId });
  }
  res
    .clearCookie("token", { httpOnly: true, secure: false })
    .clearCookie("refreshToken", { httpOnly: true, secure: false })
    .status(200)
    .json({ msg: "Logged out" });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ msg: "Not authenticated" });
      return;
    }
    const user = await User.findById(userId).select("-password");
    if (!user) {
      res.status(404).json({ msg: "User not found" });
      return;
    }
    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ msg: "User not found" });
      return;
    }

    const { username, email, password } = req.body;

    if (username) {
      user.username = username;
    }

    if (email) {
      user.email = email;
    }

    // Handle password update if provided
    if (password && password.trim() !== "") {
      user.password = await bcrypt.hash(password, 10);
    }

    // ✅ Handle avatar image if uploaded
    if (req.file && req.file.buffer) {
      try {
        console.log("Uploading avatar to Cloudinary...");
        console.log("Cloudinary config:", {
          cloudName: process.env.CLOUDINARY_CLOUD_NAME ? "Set" : "Not set",
          apiKey: process.env.CLOUDINARY_API_KEY ? "Set" : "Not set",
          apiSecret: process.env.CLOUDINARY_API_SECRET ? "Set" : "Not set",
        });

        const { secure_url } = await uploadToCloudinary(
          req.file.buffer,
          "avatars"
        );
        user.avatar = secure_url;
        console.log("Avatar uploaded successfully:", secure_url);
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);
        res.status(500).json({ msg: "Failed to upload avatar" });
        return;
      }
    }

    await user.save();

    res.status(200).json({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ msg: "Failed to update profile" });
  }
};

export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      res.status(400).json({ msg: "All fields are required." });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      res.status(400).json({ msg: "New passwords do not match." });
      return;
    }

    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;

    if (!strongPasswordRegex.test(newPassword)) {
      res.status(400).json({
        msg: "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
      });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ msg: "User not found." });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ msg: "Current password is incorrect." });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Optionally issue a new JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    res
      .cookie("token", token, { httpOnly: true, secure: false }) // secure: true in prod
      .status(200)
      .json({ msg: "Password changed successfully." });
  } catch (err) {
    res.status(500).json({ msg: "Server error changing password." });
  }
};

export const refreshToken = async (req: Request, res: Response, next: any) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      res.status(401).json({ message: "No refresh token" });
      return;
    }
    const stored = await RefreshToken.findOne({ token });
    if (!stored) {
      res.status(403).json({ message: "Invalid refresh token" });
      return;
    }
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
    // @ts-ignore
    const accessToken = createAccessToken(payload.id);
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: false,
      maxAge: 15 * 60 * 1000,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
};
