import { Response } from "express";
import { Class } from "../models";
import { AuthRequest } from "../middleware/auth";

export const getClasses = async (_req: AuthRequest, res: Response) => {
  try {
    const classes = await Class.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch classes", error: String(error) });
  }
};

export const createClass = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await Class.findOne({ name: req.body.name });
    if (existing) return res.status(400).json({ success: false, message: "Class already exists" });
    const cls = await Class.create(req.body);
    res.status(201).json({ success: true, message: "Class created", data: cls });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create class", error: String(error) });
  }
};

export const updateClass = async (req: AuthRequest, res: Response) => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });
    res.json({ success: true, message: "Class updated", data: cls });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update class", error: String(error) });
  }
};

export const deleteClass = async (req: AuthRequest, res: Response) => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });
    res.json({ success: true, message: "Class deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete class", error: String(error) });
  }
};
