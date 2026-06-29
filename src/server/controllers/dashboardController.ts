import { Response } from "express";
import { Student, FeePayment, FeeStructure } from "../models";
import { AuthRequest } from "../middleware/auth";

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
    const [
      totalStudents,
      totalCollectionAgg,
      todayCollectionAgg,
      activeStudents,
      feeStructures,
      paidByStudentSession,
      recentPayments,
    ] = await Promise.all([
      Student.countDocuments({ status: "active" }),
      FeePayment.aggregate([{ $group: { _id: null, total: { $sum: "$currentPayment" } } }]),
      FeePayment.aggregate([
        { $match: { paymentDate: { $gte: startOfToday(), $lte: endOfToday() } } },
        { $group: { _id: null, total: { $sum: "$currentPayment" } } },
      ]),
      Student.find({ status: "active" }).select("_id classId sessionId transportRequired").lean(),
      FeeStructure.find().lean(),
      FeePayment.aggregate([
        {
          $group: {
            _id: { studentId: "$studentId", sessionId: "$sessionId" },
            paid: { $sum: "$currentPayment" },
          },
        },
      ]),
      FeePayment.find()
      .populate({ path: "studentId", select: "studentName registrationNumber", populate: { path: "classId", select: "name" } })
      .sort({ paymentDate: -1 })
        .limit(5),
    ]);

    const totalFeeCollected = totalCollectionAgg[0]?.total || 0;
    const todayCollection = todayCollectionAgg[0]?.total || 0;
    const feeStructureByClassSession = new Map(
      feeStructures.map((structure) => [`${structure.classId.toString()}-${structure.sessionId.toString()}`, structure])
    );
    const paidByStudentSessionMap = new Map(
      paidByStudentSession.map((payment) => [
        `${payment._id.studentId.toString()}-${payment._id.sessionId.toString()}`,
        payment.paid as number,
      ])
    );

    const pendingFees = activeStudents.reduce((sum, student) => {
      const structure = feeStructureByClassSession.get(`${student.classId.toString()}-${student.sessionId.toString()}`);
      if (!structure) return sum;

      const totalFee =
        structure.admissionFee +
        structure.monthlyFee * 12 +
        structure.computerFee +
        structure.examFee +
        structure.otherFee;
      const paid = paidByStudentSessionMap.get(`${student._id.toString()}-${student.sessionId.toString()}`) || 0;
      return sum + Math.max(0, totalFee - paid);
    }, 0);

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
