import { Types } from "mongoose";
import { AcademicSession } from "../models";

/** Resolve session: explicit id → active+current → active latest → any latest */
export const resolveAcademicSession = async (sessionId?: string) => {
  if (sessionId && Types.ObjectId.isValid(sessionId)) {
    const byId = await AcademicSession.findById(sessionId);
    if (byId) return byId;
  }

  return (
    (await AcademicSession.findOne({ isActive: true, isCurrent: true })) ||
    (await AcademicSession.findOne({ isActive: true }).sort({ startDate: -1 })) ||
    (await AcademicSession.findOne({ isCurrent: true }).sort({ startDate: -1 })) ||
    (await AcademicSession.findOne().sort({ startDate: -1 }))
  );
};
