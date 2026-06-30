import { Response } from "express";
import { Types } from "mongoose";
import * as XLSX from "xlsx";
import { AcademicSession, Student, FeePayment } from "../models";
import { AuthRequest } from "../middleware/auth";
import { createSessionFeeCache, getFeeStatusFromCache } from "../services/feeService";
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
    const adminPaymentMatch: Record<string, unknown> = { sessionId: sessionObjectId };
    if (!isSuperAdmin && req.user?.id) {
      adminPaymentMatch.collectedBy = new Types.ObjectId(req.user.id);
    }

    const [totalStudents, totalCollectionAgg, todayCollectionAgg, recentPayments, feeCache, activeStudents] =
      await Promise.all([
        Student.countDocuments({ status: "active" }),
        FeePayment.aggregate([
          { $match: isSuperAdmin ? { sessionId: sessionObjectId } : adminPaymentMatch },
          { $group: { _id: null, total: { $sum: "$currentPayment" } } },
        ]),
        FeePayment.aggregate([
          {
            $match: {
              ...(isSuperAdmin ? { sessionId: sessionObjectId } : adminPaymentMatch),
              paymentDate: { $gte: startOfToday(), $lte: endOfToday() },
            },
          },
          { $group: { _id: null, total: { $sum: "$currentPayment" } } },
        ]),
        FeePayment.find(isSuperAdmin ? { sessionId: sessionObjectId } : adminPaymentMatch)
          .populate({
            path: "studentId",
            select: "studentName registrationNumber",
            populate: { path: "classId", select: "name" },
          })
          .sort({ paymentDate: -1 })
          .limit(5)
          .lean(),
        createSessionFeeCache(session._id.toString()),
        Student.find({ status: "active" })
          .select("_id classId studentName registrationNumber feeDiscount")
          .populate("classId", "name")
          .lean(),
      ]);

    const totalFeeCollected = totalCollectionAgg[0]?.total || 0;
    const todayCollection = todayCollectionAgg[0]?.total || 0;

    const studentFeeStatuses = activeStudents.map((student) => {
      const classId = (student.classId as { _id: Types.ObjectId })._id.toString();
      const status = getFeeStatusFromCache(
        feeCache,
        classId,
        student._id.toString(),
        (student as { feeDiscount?: number }).feeDiscount || 0
      );
      return {
        _id: student._id.toString(),
        studentName: student.studentName,
        registrationNumber: student.registrationNumber,
        className: (student.classId as { name?: string })?.name || "N/A",
        ...status,
      };
    });

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
    const { payments, summary } = await fetchCollectionReportData(req.query, req.user);
    res.json({ success: true, data: { payments, summary } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch report", error: String(error) });
  }
};

export const getReportCollectors = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    const { User } = await import("../models");
    const users = await User.find({ role: { $in: ["admin", "super_admin"] }, isActive: true })
      .select("name email role")
      .sort({ name: 1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch collectors", error: String(error) });
  }
};

const formatPaymentDate = (date: Date) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const buildReportRows = (payments: Awaited<ReturnType<typeof fetchCollectionReportData>>["payments"]) =>
  payments.map((p, index) => {
    const student = p.studentId as {
      studentName?: string;
      registrationNumber?: string;
      admissionNumber?: string;
      fatherName?: string;
      mobileNumber?: string;
      classId?: { name?: string };
      sectionId?: { name?: string };
    };
    const session = p.sessionId as { name?: string };
    const collectedBy = p.collectedBy as { name?: string };
    const breakdown = (p.feeBreakdown || {}) as Record<string, number>;

    return {
      "S.No": index + 1,
      "Receipt No": p.receiptNumber,
      "Payment Date": formatPaymentDate(p.paymentDate),
      Session: session?.name || "",
      "Reg. Number": student?.registrationNumber || "",
      "Admission No": student?.admissionNumber || "",
      "Student Name": student?.studentName || "",
      "Father Name": student?.fatherName || "",
      Mobile: student?.mobileNumber || "",
      Class: student?.classId?.name || "",
      Section: student?.sectionId?.name || "",
      "Net Total Fee": p.totalFee,
      "Previous Due": p.previousDue,
      "Current Payment": p.currentPayment,
      "Paid After Payment": p.paidAmount,
      Balance: p.balance,
      "Payment Status": p.paymentStatus,
      "Payment Mode": p.paymentMode.replace("_", " "),
      "Collected By": collectedBy?.name || "",
      Remarks: p.remarks || "",
      "Admission Fee": breakdown.admissionFee ?? 0,
      "Monthly Fee (×12)": breakdown.monthlyFee ?? 0,
      "Annual Fee": breakdown.annualFee ?? 0,
      "Computer Fee": breakdown.computerFee ?? 0,
      "Exam Fee": breakdown.examFee ?? 0,
      "Other Fee": breakdown.otherFee ?? 0,
      "Gross Total": breakdown.grossTotal ?? p.totalFee,
      "Total Discount": breakdown.totalDiscount ?? 0,
    };
  });

export const downloadCollectionReportExcel = async (req: AuthRequest, res: Response) => {
  try {
    const { payments, summary } = await fetchCollectionReportData(req.query, req.user);
    const rows = buildReportRows(payments);

    const summaryRows = [
      { Metric: "Total Collections", Value: summary.totalCollections },
      { Metric: "Total Amount (₹)", Value: summary.totalAmount },
      { Metric: "Report Generated", Value: new Date().toLocaleString("en-IN") },
      { Metric: "Collected By", Value: summary.collectedByName || "All" },
      { Metric: "Start Date", Value: (req.query.startDate as string) || "All" },
      { Metric: "End Date", Value: (req.query.endDate as string) || "All" },
      { Metric: "Session Filter", Value: summary.sessionName || "All Sessions" },
      { Metric: "Class Filter", Value: summary.className || "All Classes" },
      { Metric: "", Value: "" },
      ...Object.entries(summary.byMode).map(([mode, amount]) => ({
        Metric: `By Mode - ${mode.replace("_", " ")}`,
        Value: amount,
      })),
    ];

    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    const dataSheet = XLSX.utils.json_to_sheet(
      rows.length > 0
        ? rows
        : [{ Message: "No fee collections found for selected filters" }]
    );

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(workbook, dataSheet, "Fee Collections");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const filename = `fee-collection-report-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to export report", error: String(error) });
  }
};

async function fetchCollectionReportData(
  query: Record<string, unknown>,
  user?: { id: string; role: string; name?: string }
) {
  const startDate = query.startDate as string | undefined;
  const endDate = query.endDate as string | undefined;
  const classId = query.classId as string | undefined;
  const sessionId = query.sessionId as string | undefined;
  const collectedByQuery = query.collectedBy as string | undefined;

  const filter: Record<string, unknown> = {};
  if (sessionId) filter.sessionId = sessionId;

  let collectedByName = "All Admins";
  if (user?.role === "admin") {
    filter.collectedBy = new Types.ObjectId(user.id);
    collectedByName = user.name || "You";
  } else if (user?.role === "super_admin" && collectedByQuery) {
    filter.collectedBy = new Types.ObjectId(collectedByQuery);
    const { User } = await import("../models");
    const collector = await User.findById(collectedByQuery).select("name");
    collectedByName = collector?.name || "Selected Admin";
  }

  if (startDate || endDate) {
    filter.paymentDate = {};
    if (startDate) (filter.paymentDate as Record<string, Date>).$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      (filter.paymentDate as Record<string, Date>).$lte = end;
    }
  }

  const payments = await FeePayment.find(filter)
    .populate({
      path: "studentId",
      select: "studentName registrationNumber admissionNumber fatherName mobileNumber",
      populate: [
        { path: "classId", select: "name" },
        { path: "sectionId", select: "name" },
      ],
    })
    .populate("sessionId", "name")
    .populate("collectedBy", "name")
    .sort({ paymentDate: -1 });

  let filtered = payments;
  if (classId) {
    filtered = payments.filter(
      (p) =>
        (p.studentId as { classId?: { _id?: { toString: () => string } } })?.classId?._id?.toString() === classId
    );
  }

  let sessionName = "All Sessions";
  let className = "All Classes";
  if (sessionId) {
    const session = await AcademicSession.findById(sessionId).select("name");
    sessionName = session?.name || sessionName;
  }
  if (classId) {
    const { Class } = await import("../models");
    const cls = await Class.findById(classId).select("name");
    className = cls?.name || className;
  }

  const summary = {
    totalCollections: filtered.length,
    totalAmount: filtered.reduce((sum, p) => sum + p.currentPayment, 0),
    sessionName,
    className,
    collectedByName,
    byMode: filtered.reduce(
      (acc, p) => {
        acc[p.paymentMode] = (acc[p.paymentMode] || 0) + p.currentPayment;
        return acc;
      },
      {} as Record<string, number>
    ),
  };

  return { payments: filtered, summary };
}

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
