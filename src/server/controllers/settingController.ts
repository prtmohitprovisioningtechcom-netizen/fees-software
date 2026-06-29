import { Response } from "express";
import { AppSetting } from "../models";
import { AuthRequest } from "../middleware/auth";

const defaultSettings = {
  schoolName: "School ERP",
  appName: "Fee Management",
  logo: "",
  address: "",
  phone: "",
  email: "",
};

const getOrCreateSettings = async () => {
  const existing = await AppSetting.findOne();
  if (existing) return existing;
  return AppSetting.create(defaultSettings);
};

export const getSettings = async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch settings", error: String(error) });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await getOrCreateSettings();
    const updates = {
      schoolName: req.body.schoolName || defaultSettings.schoolName,
      appName: req.body.appName || defaultSettings.appName,
      logo: req.body.logo || "",
      address: req.body.address || "",
      phone: req.body.phone || "",
      email: req.body.email || "",
    };

    settings.set(updates);
    await settings.save();

    res.json({ success: true, message: "Settings updated", data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update settings", error: String(error) });
  }
};
