import { Response } from "express";
import { Student, FeePayment, FeeStructure } from "../models";
import { AuthRequest } from "../middleware/auth";
import { calculateFee } from "../services/feeService";

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

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const isSuperAdmin = req.user?.role === "super_admin";
    const totalStudents = await Student.countDocuments({ status: "active" });

    const allPayments = await FeePayment.find();
    const totalFeeCollected = allPayments.reduce((sum, p) => sum + p.currentPayment, 0);

    const todayPayments = await FeePayment.find({
      paymentDate: { $gte: startOfToday(), $lte: endOfToday() },
    });
    const todayCollection = todayPayments.reduce((sum, p) => sum + p.currentPayment, 0);

    const activeStudents = await Student.find({ status: "active" });
    let pendingFees = 0;

    for (const student of activeStudents) {
      try {
        const calc = await calculateFee(
          student._id.toString(),
          student.sessionId.toString(),
          student.classId.toString(),
          0,
          student.transportRequired
        );
        pendingFees += calc.remainingAmount;
      } catch {
        // skip students without fee structure
      }
    }

    const recentPayments = await FeePayment.find()
      .populate({ path: "studentId", select: "studentName registrationNumber", populate: { path: "classId", select: "name" } })
      .sort({ paymentDate: -1 })
      .limit(5);

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
      totalStudents,
      totalFeeCollected: isSuperAdmin ? totalFeeCollected : undefined,
      pendingFees,
      todayCollection,
      recentPayments: formattedRecent,
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats", error: String(error) });
  }
};

export const getCollectionReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, classId } = req.query;
    const filter: Record<string, unknown> = {};

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
    const structures = await FeeStructure.find()
      .populate("classId", "name")
      .populate("sessionId", "name");
    res.json({ success: true, data: structures });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch summary", error: String(error) });
  }
};
