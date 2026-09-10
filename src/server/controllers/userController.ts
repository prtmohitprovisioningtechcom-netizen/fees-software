import { Response } from "express";
import { User } from "../models";
import { AuthRequest } from "../middleware/auth";

export const getUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({ role: "admin" }).select("-password").sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch users", error: String(error) });
  }
};

export const getPasswordTargets = async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({ role: { $in: ["super_admin", "admin"] } })
      .select("-password")
      .sort({ role: -1, name: 1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch users", error: String(error) });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await User.findOne({ email: req.body.email });
    if (existing) return res.status(400).json({ success: false, message: "Email already exists" });

    const user = await User.create({ ...req.body, role: "admin" });
    const { password: _, ...userData } = user.toObject();
    res.status(201).json({ success: true, message: "Admin user created", data: userData });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create user", error: String(error) });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { password, role, ...updates } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User updated", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update user", error: String(error) });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete user", error: String(error) });
  }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? "activated" : "deactivated"}`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to toggle status", error: String(error) });
  }
};

export const changeUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;
    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.password = String(password);
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to change password", error: String(error) });
  }
};
