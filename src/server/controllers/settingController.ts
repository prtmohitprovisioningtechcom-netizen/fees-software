import { Response } from "express";
import { AppSetting } from "../models";
import { AuthRequest } from "../middleware/auth";
import { mergeFeePolicy, validateFeePolicy, type FeePolicy } from "@/lib/fee-policy";
import { clearFeePolicyCache } from "../services/feeService";

const defaultSettings = {
  schoolName: "",
  appName: "",
  logo: "",
  address: "",
  phone: "",
  email: "",
};

const MAX_LOGO_LENGTH = 2_000_000;

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
    const logo = String(req.body.logo || "");

    if (logo.length > MAX_LOGO_LENGTH) {
      return res.status(413).json({
        success: false,
        message: "Logo image is too large. Please upload a smaller image (under 1.5 MB).",
      });
    }

    const updates: Record<string, unknown> = {
      schoolName: typeof req.body.schoolName === "string" ? req.body.schoolName.trim() : "",
      appName: typeof req.body.appName === "string" ? req.body.appName.trim() : "",
      logo,
      address: typeof req.body.address === "string" ? req.body.address : "",
      phone: typeof req.body.phone === "string" ? req.body.phone : "",
      email: typeof req.body.email === "string" ? req.body.email : "",
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
