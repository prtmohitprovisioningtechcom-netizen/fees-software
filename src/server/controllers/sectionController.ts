import { Response } from "express";
import { Section } from "../models";
import { AuthRequest } from "../middleware/auth";

export const getSections = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, unknown> = { isActive: true };
    if (req.query.classId) filter.classId = req.query.classId;
    const sections = await Section.find(filter).populate("classId", "name").sort({ name: 1 });
    res.json({ success: true, data: sections });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch sections", error: String(error) });
  }
};

export const createSection = async (req: AuthRequest, res: Response) => {
  try {
    const section = await Section.create(req.body);
    await section.populate("classId", "name");
    res.status(201).json({ success: true, message: "Section created", data: section });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return res.status(400).json({ success: false, message: "Section already exists for this class" });
    }
    res.status(500).json({ success: false, message: "Failed to create section", error: String(error) });
  }
};

export const updateSection = async (req: AuthRequest, res: Response) => {
  try {
    const section = await Section.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("classId", "name");
    if (!section) return res.status(404).json({ success: false, message: "Section not found" });
    res.json({ success: true, message: "Section updated", data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update section", error: String(error) });
  }
};

export const deleteSection = async (req: AuthRequest, res: Response) => {
  try {
    const section = await Section.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!section) return res.status(404).json({ success: false, message: "Section not found" });
    res.json({ success: true, message: "Section deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete section", error: String(error) });
  }
};
