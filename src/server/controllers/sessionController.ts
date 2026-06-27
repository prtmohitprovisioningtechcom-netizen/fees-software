import { Response } from "express";
import { AcademicSession } from "../models";
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
    if (req.body.isCurrent) {
      await AcademicSession.updateMany({}, { isCurrent: false });
    }
    const session = await AcademicSession.create(req.body);
    res.status(201).json({ success: true, message: "Session created", data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create session", error: String(error) });
  }
};

export const updateSession = async (req: AuthRequest, res: Response) => {
  try {
    if (req.body.isCurrent) {
      await AcademicSession.updateMany({}, { isCurrent: false });
    }
    const session = await AcademicSession.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    res.json({ success: true, message: "Session updated", data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update session", error: String(error) });
  }
};

export const deleteSession = async (req: AuthRequest, res: Response) => {
  try {
    const session = await AcademicSession.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    res.json({ success: true, message: "Session deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete session", error: String(error) });
  }
};
