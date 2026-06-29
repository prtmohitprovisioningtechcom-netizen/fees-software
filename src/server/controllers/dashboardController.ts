import { Response } from "express";
import { Types } from "mongoose";
import { AcademicSession, Student, FeePayment } from "../models";
import { AuthRequest } from "../middleware/auth";
import { getStudentSessionFeeStatus } from "../services/feeService";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

const resolveSessionId = async (sessionId?: string) => {
  if (sessionId && Types.ObjectId.isValid(sessionId)) {
    const session = await AcademicSession.findById(sessionId);
    if (session) return session;
  }
  return (
    (await AcademicSession.findOne({ isActive: true, isCurrent: true })) ||
    (await AcademicSession.findOne({ isActive: true }).sort({ startDate: -1 }))
  );
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const isSuperAdmin = req.user?.role === "super_admin";
    const session = await resolveSessionId(req.query.sessionId as string);
    if (!session) {
      return res.status(400).json({ success: false, message: "Academic session not found" });
    }

    const sessionObjectId = session._id;

    const [totalStudents, totalCollectionAgg, todayCollectionAgg, activeStudents, recentPayments] =
      await Promise.all([
        Student.countDocuments({ status: "active" }),
        FeePayment.aggregate([
          { $match: { sessionId: sessionObjectId } },
          { $group: { _id: null, total: { $sum: "$currentPayment" } } },
        ]),
        FeePayment.aggregate([
          {
            $match: {
              sessionId: sessionObjectId,
              paymentDate: { $gte: startOfToday(), $lte: endOfToday() },
            },
          },
          { $group: { _id: null, total: { $sum: "$currentPayment" } } },
        ]),
        Student.find({ status: "active" })
          .select("_id classId sessionId studentName registrationNumber")
          .populate("classId", "name")
          .lean(),
        FeePayment.find({ sessionId: sessionObjectId })
          .populate({
            path: "studentId",
            select: "studentName registrationNumber",
            populate: { path: "classId", select: "name" },
          })
          .sort({ paymentDate: -1 })
          .limit(5),
      ]);

    const totalFeeCollected = totalCollectionAgg[0]?.total || 0;
    const todayCollection = todayCollectionAgg[0]?.total || 0;

    const studentFeeStatuses = await Promise.all(
      activeStudents.map(async (student) => {
        const status = await getStudentSessionFeeStatus(
          student._id.toString(),
          session._id.toString(),
          student.classId._id.toString()
        );
        return {
          _id: student._id.toString(),
          studentName: student.studentName,
          registrationNumber: student.registrationNumber,
          className: (student.classId as { name?: string })?.name || "N/A",
          ...status,
        };
      })
    );

    const pendingFees = studentFeeStatuses.reduce((sum, item) => sum + item.pendingAmount, 0);
    const pendingStudents = studentFeeStatuses
      .filter((item) => item.pendingAmount > 0 && item.hasFeeStructure)
      .sort((a, b) => b.pendingAmount - a.pendingAmount)
      .slice(0, 10);

    const formattedRecent = recentPayments.map((p) => ({
      _id: p._id.toString(),
      receiptNumber: p.receiptNumber,
      studentName: (p.studentId as { studentName?: string })?.studentName || "N/A",
      registrationNumber: (p.studentId as { registrationNumber?: string })?.registrationNumber || "N/A",
      className: ((p.studentId as { classId?: { name?: string } })?.classId as { name?: string })?.name || "N/A",
      amount: p.currentPayment,
      paymentDate: p.paymentDate.toISOString(),
      paymentMode: p.paymentMode,
      paymentStatus: p.paymentStatus,
    }));

    const stats = {
      session: { _id: session._id.toString(), name: session.name },
      totalStudents,
      totalFeeCollected: isSuperAdmin ? totalFeeCollected : undefined,
      pendingFees,
      todayCollection,
      recentPayments: formattedRecent,
      pendingStudents,
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats", error: String(error) });
  }
};

export const getCollectionReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, classId, sessionId } = req.query;
    const filter: Record<string, unknown> = {};

    if (sessionId) filter.sessionId = sessionId;
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) (filter.paymentDate as Record<string, Date>).$gte = new Date(startDate as string);
      if (endDate) (filter.paymentDate as Record<string, Date>).$lte = new Date(endDate as string);
    }

    const payments = await FeePayment.find(filter)
      .populate({
        path: "studentId",
        populate: [{ path: "classId", select: "name" }, { path: "sectionId", select: "name" }],
      })
      .populate("collectedBy", "name")
      .sort({ paymentDate: -1 });

    let filtered = payments;
    if (classId) {
      filtered = payments.filter(
        (p) => (p.studentId as { classId?: { _id?: { toString: () => string } } })?.classId?._id?.toString() === classId
      );
    }

    const summary = {
      totalCollections: filtered.length,
      totalAmount: filtered.reduce((sum, p) => sum + p.currentPayment, 0),
      byMode: filtered.reduce(
        (acc, p) => {
          acc[p.paymentMode] = (acc[p.paymentMode] || 0) + p.currentPayment;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    res.json({ success: true, data: { payments: filtered, summary } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch report", error: String(error) });
  }
};

export const getFeeStructuresSummary = async (_req: AuthRequest, res: Response) => {
  try {
    const { FeeStructure } = await import("../models");
    const structures = await FeeStructure.find()
      .populate("classId", "name")
      .populate("sessionId", "name");
    res.json({ success: true, data: structures });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch summary", error: String(error) });
  }
};
