import { Response } from "express";
import { Types } from "mongoose";
import { AcademicSession, Student, FeeStructure, FeePayment } from "../models";
import { AuthRequest } from "../middleware/auth";

export const getSessions = async (_req: AuthRequest, res: Response) => {
  try {
    const sessions = await AcademicSession.find({ isActive: true }).sort({ startDate: -1 });
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch sessions", error: String(error) });
  }
};

export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const name = String(req.body.name || "").trim();
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    const isCurrent = Boolean(req.body.isCurrent);

    if (!name) {
      return res.status(400).json({ success: false, message: "Session name is required" });
    }
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid start or end date" });
    }
    if (endDate < startDate) {
      return res.status(400).json({ success: false, message: "End date must be on or after start date" });
    }

    if (isCurrent) {
      await AcademicSession.updateMany({}, { isCurrent: false });
    }

    const existing = await AcademicSession.findOne({ name });
    if (existing) {
      if (existing.isActive) {
        return res.status(400).json({ success: false, message: "A session with this name already exists" });
      }
      existing.isActive = true;
      existing.startDate = startDate;
      existing.endDate = endDate;
      existing.isCurrent = isCurrent;
      await existing.save();
      return res.status(201).json({ success: true, message: "Session restored", data: existing });
    }

    const session = await AcademicSession.create({
      name,
      startDate,
      endDate,
      isCurrent,
      isActive: true,
    });
    res.status(201).json({ success: true, message: "Session created", data: session });
  } catch (error) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return res.status(400).json({ success: false, message: "A session with this name already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to create session", error: String(error) });
  }
};

export const updateSession = async (req: AuthRequest, res: Response) => {
  try {
    const updates: Record<string, unknown> = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.startDate !== undefined) updates.startDate = new Date(req.body.startDate);
    if (req.body.endDate !== undefined) updates.endDate = new Date(req.body.endDate);
    if (req.body.isCurrent !== undefined) updates.isCurrent = Boolean(req.body.isCurrent);

    if (updates.startDate instanceof Date && Number.isNaN(updates.startDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid start date" });
    }
    if (updates.endDate instanceof Date && Number.isNaN(updates.endDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid end date" });
    }

    if (req.body.isCurrent) {
      await AcademicSession.updateMany({}, { isCurrent: false });
    }

    const session = await AcademicSession.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    res.json({ success: true, message: "Session updated", data: session });
  } catch (error) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return res.status(400).json({ success: false, message: "A session with this name already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to update session", error: String(error) });
  }
};

export const deleteSession = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid session id" });
    }

    const session = await AcademicSession.findById(id);
    if (!session || !session.isActive) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const [studentCount, feeStructureCount, paymentCount] = await Promise.all([
      Student.countDocuments({ sessionId: id, status: { $ne: "left" } }),
      FeeStructure.countDocuments({ sessionId: id }),
      FeePayment.countDocuments({ sessionId: id }),
    ]);

    if (studentCount > 0 || feeStructureCount > 0 || paymentCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete session with linked students, fee structures, or payments.",
      });
    }

    session.isActive = false;
    if (session.isCurrent) session.isCurrent = false;
    await session.save();

    res.json({ success: true, message: "Session deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete session", error: String(error) });
  }
};
