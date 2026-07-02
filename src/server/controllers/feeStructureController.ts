import { Response } from "express";
import { FeeStructure } from "../models";
import { AuthRequest } from "../middleware/auth";
import { getGrossStructureTotal } from "../services/feeService";

const buildTotalFee = (body: {
  admissionFee?: number;
  monthlyFee?: number;
  annualFee?: number;
  computerFee?: number;
  examFee?: number;
  otherFee?: number;
}) =>
  getGrossStructureTotal(
    {
      admissionFee: Number(body.admissionFee) || 0,
      monthlyFee: Number(body.monthlyFee) || 0,
      annualFee: Number(body.annualFee) || 0,
      computerFee: Number(body.computerFee) || 0,
      examFee: Number(body.examFee) || 0,
      otherFee: Number(body.otherFee) || 0,
    },
    false
  );

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

    const admissionFee = Number(req.body.admissionFee) || 0;
    const monthlyFee = Number(req.body.monthlyFee) || 0;
    const annualFee = Number(req.body.annualFee) || 0;
    const computerFee = Number(req.body.computerFee) || 0;
    const examFee = Number(req.body.examFee) || 0;
    const otherFee = Number(req.body.otherFee) || 0;
    const discount = Number(req.body.discount) || 0;
    const transportFee = 0;
    const grossTotal = buildTotalFee({ admissionFee, monthlyFee, annualFee, computerFee, examFee, otherFee });
    const totalFee = Math.max(0, grossTotal - discount);

    const structure = await FeeStructure.create({
      ...req.body,
      admissionFee,
      monthlyFee,
      annualFee,
      computerFee,
      examFee,
      otherFee,
      discount,
      transportFee,
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
    const current = await FeeStructure.findById(req.params.id);
    if (!current) return res.status(404).json({ success: false, message: "Fee structure not found" });

    const admissionFee = updates.admissionFee ?? current.admissionFee;
    const monthlyFee = updates.monthlyFee ?? current.monthlyFee;
    const annualFee = updates.annualFee ?? current.annualFee;
    const computerFee = updates.computerFee ?? current.computerFee;
    const examFee = updates.examFee ?? current.examFee;
    const otherFee = updates.otherFee ?? current.otherFee;

    updates.transportFee = 0;
    const grossTotal = buildTotalFee({ admissionFee, monthlyFee, annualFee, computerFee, examFee, otherFee });
    const discount = updates.discount ?? current.discount ?? 0;
    updates.totalFee = Math.max(0, grossTotal - Number(discount));

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
