import { Response } from "express";
import { Class } from "../models";
import { AuthRequest } from "../middleware/auth";
import { compareSchoolClassNames, EXCEL_IMPORT_CLASS_DESC } from "../constants/classes";

const excelImportClassFilter = {
  isActive: true,
  description: EXCEL_IMPORT_CLASS_DESC,
};

export const getClasses = async (_req: AuthRequest, res: Response) => {
  try {
    const classes = await Class.find(excelImportClassFilter);
    classes.sort((a, b) => compareSchoolClassNames(a.name, b.name));
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch classes", error: String(error) });
  }
};

export const createClass = async (req: AuthRequest, res: Response) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Class name is required" });

    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await Class.findOne({
      isActive: true,
      description: EXCEL_IMPORT_CLASS_DESC,
      name: { $regex: `^${escaped}$`, $options: "i" },
    });
    if (existing) return res.status(400).json({ success: false, message: "Class already exists" });

    const inactive = await Class.findOne({
      name: { $regex: `^${escaped}$`, $options: "i" },
      isActive: false,
    });
    if (inactive) {
      inactive.name = name;
      inactive.description = EXCEL_IMPORT_CLASS_DESC;
      inactive.isActive = true;
      await inactive.save();
      return res.status(201).json({ success: true, message: "Class created", data: inactive });
    }

    const cls = await Class.create({
      name,
      description: EXCEL_IMPORT_CLASS_DESC,
      isActive: true,
    });
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
