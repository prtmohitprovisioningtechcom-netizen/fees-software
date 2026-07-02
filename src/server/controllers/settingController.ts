import { Response } from "express";
import { AppSetting } from "../models";
import { AuthRequest } from "../middleware/auth";
import { mergeFeePolicy, validateFeePolicy, type FeePolicy } from "@/lib/fee-policy";
import { clearFeePolicyCache } from "../services/feeService";

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
    const data = settings.toObject();
    res.json({
      success: true,
      data: {
        ...data,
        feePolicy: mergeFeePolicy(data.feePolicy as Parameters<typeof mergeFeePolicy>[0]),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch settings", error: String(error) });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await getOrCreateSettings();
    const updates: Record<string, unknown> = {
      schoolName: req.body.schoolName || defaultSettings.schoolName,
      appName: req.body.appName || defaultSettings.appName,
      logo: req.body.logo || "",
      address: req.body.address || "",
      phone: req.body.phone || "",
      email: req.body.email || "",
    };

    if (req.body.feePolicy) {
      const policy = mergeFeePolicy(req.body.feePolicy as FeePolicy);
      const error = validateFeePolicy(policy);
      if (error) {
        return res.status(400).json({ success: false, message: error });
      }
      updates.feePolicy = policy;
    }

    settings.set(updates);
    await settings.save();
    clearFeePolicyCache();

    const data = settings.toObject();
    res.json({
      success: true,
      message: "Settings updated",
      data: {
        ...data,
        feePolicy: mergeFeePolicy(data.feePolicy as Parameters<typeof mergeFeePolicy>[0]),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update settings", error: String(error) });
  }
};
