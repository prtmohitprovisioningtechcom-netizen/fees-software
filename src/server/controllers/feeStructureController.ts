import { Response } from "express";
import { FeeStructure } from "../models";
import { AuthRequest } from "../middleware/auth";

export const getFeeStructures = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.classId) filter.classId = req.query.classId;
    if (req.query.sessionId) filter.sessionId = req.query.sessionId;

    const structures = await FeeStructure.find(filter)
      .populate("classId", "name")
      .populate("sessionId", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: structures });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch fee structures", error: String(error) });
  }
};

export const getFeeStructureByClass = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, sessionId } = req.params;
    const structure = await FeeStructure.findOne({ classId, sessionId })
      .populate("classId", "name")
      .populate("sessionId", "name");
    if (!structure) return res.status(404).json({ success: false, message: "Fee structure not found" });
    res.json({ success: true, data: structure });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch fee structure", error: String(error) });
  }
};

export const createFeeStructure = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await FeeStructure.findOne({ classId: req.body.classId, sessionId: req.body.sessionId });
    if (existing) return res.status(400).json({ success: false, message: "Fee structure already exists for this class and session" });

    const totalFee =
      req.body.admissionFee +
      req.body.monthlyFee * 12 +
      req.body.computerFee +
      req.body.examFee +
      req.body.transportFee +
      req.body.otherFee;

    const structure = await FeeStructure.create({
      ...req.body,
      totalFee,
      createdBy: req.user?.id,
    });

    await structure.populate(["classId", "sessionId", "createdBy"]);
    res.status(201).json({ success: true, message: "Fee structure created", data: structure });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create fee structure", error: String(error) });
  }
};

export const updateFeeStructure = async (req: AuthRequest, res: Response) => {
  try {
    const updates = { ...req.body };
    if (
      updates.admissionFee !== undefined ||
      updates.monthlyFee !== undefined ||
      updates.computerFee !== undefined ||
      updates.examFee !== undefined ||
      updates.transportFee !== undefined ||
      updates.otherFee !== undefined
    ) {
      const current = await FeeStructure.findById(req.params.id);
      if (!current) return res.status(404).json({ success: false, message: "Fee structure not found" });

      const admissionFee = updates.admissionFee ?? current.admissionFee;
      const monthlyFee = updates.monthlyFee ?? current.monthlyFee;
      const computerFee = updates.computerFee ?? current.computerFee;
      const examFee = updates.examFee ?? current.examFee;
      const transportFee = updates.transportFee ?? current.transportFee;
      const otherFee = updates.otherFee ?? current.otherFee;

      updates.totalFee = admissionFee + monthlyFee * 12 + computerFee + examFee + transportFee + otherFee;
    }

    const structure = await FeeStructure.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("classId", "name")
      .populate("sessionId", "name");

    if (!structure) return res.status(404).json({ success: false, message: "Fee structure not found" });
    res.json({ success: true, message: "Fee structure updated", data: structure });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update fee structure", error: String(error) });
  }
};

export const deleteFeeStructure = async (req: AuthRequest, res: Response) => {
  try {
    const structure = await FeeStructure.findByIdAndDelete(req.params.id);
    if (!structure) return res.status(404).json({ success: false, message: "Fee structure not found" });
    res.json({ success: true, message: "Fee structure deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete fee structure", error: String(error) });
  }
};
