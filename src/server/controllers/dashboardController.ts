import { Response } from "express";
import { Types } from "mongoose";
import * as XLSX from "xlsx";
import { AcademicSession, Student, FeePayment } from "../models";
import { AuthRequest } from "../middleware/auth";
import { createSessionFeeCache, getFeeStatusFromCache, createSessionQuarterlyCache, buildStudentQuarterlyReport, aggregateQuarterlyTotals, buildStudentTransportMap, activePaymentMatch } from "../services/feeService";
import { resolveAcademicSession } from "../services/sessionService";
import { QUARTER_LABELS, type QuarterNumber } from "@/lib/fee-schedule";

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

const resolveSessionId = resolveAcademicSession;

const withActivePayments = (match: Record<string, unknown>) => ({
  $and: [match, activePaymentMatch],
});

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const isSuperAdmin = req.user?.role === "super_admin";
    const session = await resolveAcademicSession(req.query.sessionId as string);
    if (!session) {
      const totalStudents = await Student.countDocuments({ status: "active" });
      return res.json({
        success: true,
        data: {
          session: null,
          totalStudents,
          totalFeeCollected: isSuperAdmin ? 0 : undefined,
          pendingFees: 0,
          todayCollection: 0,
          recentPayments: [],
          pendingStudents: [],
          needsSession: true,
          quarterTotals: {
            1: { due: 0, collected: 0, pending: 0, countPaid: 0, countPending: 0 },
            2: { due: 0, collected: 0, pending: 0, countPaid: 0, countPending: 0 },
            3: { due: 0, collected: 0, pending: 0, countPaid: 0, countPending: 0 },
            4: { due: 0, collected: 0, pending: 0, countPaid: 0, countPending: 0 },
          },
          collectedByQuarter: { 1: 0, 2: 0, 3: 0, 4: 0 },
        },
      });
    }

    const sessionObjectId = session._id;
    const adminPaymentMatch: Record<string, unknown> = { sessionId: sessionObjectId };
    if (!isSuperAdmin && req.user?.id) {
      adminPaymentMatch.collectedBy = new Types.ObjectId(req.user.id);
    }

    const [totalCollectionAgg, todayCollectionAgg, recentPayments, feeCache, activeStudents] =
      await Promise.all([
        FeePayment.aggregate([
          { $match: withActivePayments(isSuperAdmin ? { sessionId: sessionObjectId } : adminPaymentMatch) },
          { $group: { _id: null, total: { $sum: "$currentPayment" } } },
        ]),
        FeePayment.aggregate([
          {
            $match: withActivePayments({
              ...(isSuperAdmin ? { sessionId: sessionObjectId } : adminPaymentMatch),
              paymentDate: { $gte: startOfToday(), $lte: endOfToday() },
            }),
          },
          { $group: { _id: null, total: { $sum: "$currentPayment" } } },
        ]),
        FeePayment.find(withActivePayments(isSuperAdmin ? { sessionId: sessionObjectId } : adminPaymentMatch))
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
          .select("_id classId studentName registrationNumber feeDiscount transportRequired transportRouteId")
          .populate("classId", "name")
          .lean(),
    ]);

    const totalStudents = activeStudents.length;
    const transportMap = await buildStudentTransportMap(activeStudents);

    const totalFeeCollected = totalCollectionAgg[0]?.total || 0;
    const todayCollection = todayCollectionAgg[0]?.total || 0;

    const refId = (ref: unknown): string | null => {
      if (!ref) return null;
      if (typeof ref === "string") return ref;
      if (typeof ref === "object" && ref !== null && "_id" in ref && (ref as { _id: unknown })._id != null) {
        return String((ref as { _id: unknown })._id);
      }
      const asStr = String(ref);
      return asStr && asStr !== "[object Object]" ? asStr : null;
    };

    const studentFeeStatuses = activeStudents.map((student) => {
      const classId = refId(student.classId);
      const status = classId
        ? getFeeStatusFromCache(
            feeCache,
            classId,
            student._id.toString(),
            (student as { feeDiscount?: number }).feeDiscount || 0,
            transportMap.get(student._id.toString()) || null
          )
        : {
            grossTotal: 0,
            totalDiscount: 0,
            totalFee: 0,
            paidAmount: 0,
            pendingAmount: 0,
            paymentStatus: "pending" as const,
            hasFeeStructure: false,
          };
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

    const quarterlyCache = await createSessionQuarterlyCache(
      session._id.toString(),
      activeStudents.map((s) => ({
        _id: s._id,
        transportRequired: (s as { transportRequired?: boolean }).transportRequired,
        transportRouteId: (s as { transportRouteId?: Types.ObjectId | string | null }).transportRouteId,
      }))
    );

    const quarterlyStudents = (
      await Promise.all(
        activeStudents.map(async (s) => {
          const cid = refId(s.classId);
          if (!cid) return null;
          return buildStudentQuarterlyReport(
            quarterlyCache,
            cid,
            s._id.toString(),
            (s as { feeDiscount?: number }).feeDiscount || 0
          );
        })
      )
    ).filter(Boolean) as NonNullable<Awaited<ReturnType<typeof buildStudentQuarterlyReport>>>[];

    const quarterTotals = aggregateQuarterlyTotals(quarterlyStudents);

    // Collected amounts per quarter from actual payments (reliable for cash counters)
    const byQuarterAgg = await FeePayment.aggregate<{ _id: number; total: number }>([
      { $match: withActivePayments(isSuperAdmin ? { sessionId: sessionObjectId } : adminPaymentMatch) },
      { $match: { quarter: { $in: [1, 2, 3, 4] } } },
      { $group: { _id: "$quarter", total: { $sum: "$currentPayment" } } },
    ]);
    const collectedByQuarter: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const row of byQuarterAgg) {
      if (row._id >= 1 && row._id <= 4) collectedByQuarter[row._id] = row.total;
    }

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
      quarter: p.quarter || null,
    }));

    const stats = {
      session: { _id: session._id.toString(), name: session.name },
      totalStudents,
      totalFeeCollected: isSuperAdmin ? totalFeeCollected : undefined,
      pendingFees,
      todayCollection,
      recentPayments: formattedRecent,
      pendingStudents,
      quarterTotals,
      collectedByQuarter,
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("getDashboardStats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats", error: String(error) });
  }
};

/** Student-wise fee status for one quarter (Dashboard Quarterly Overview click). */
export const getQuarterDetails = async (req: AuthRequest, res: Response) => {
  try {
    const quarter = parseInt(req.query.quarter as string, 10) as QuarterNumber;
    if (![1, 2, 3, 4].includes(quarter)) {
      return res.status(400).json({ success: false, message: "Valid quarter (1–4) is required" });
    }

    const session = await resolveAcademicSession(req.query.sessionId as string);
    if (!session) {
      return res.status(400).json({ success: false, message: "Academic session not found" });
    }

    const students = await Student.find({ status: "active" })
      .select("_id classId sectionId studentName registrationNumber feeDiscount transportRequired transportRouteId")
      .populate("classId", "name")
      .populate("sectionId", "name")
      .sort({ studentName: 1 })
      .lean();

    const refId = (ref: unknown): string | null => {
      if (!ref) return null;
      if (typeof ref === "string") return ref;
      if (typeof ref === "object" && ref !== null && "_id" in ref && (ref as { _id: unknown })._id != null) {
        return String((ref as { _id: unknown })._id);
      }
      const asStr = String(ref);
      return asStr && asStr !== "[object Object]" ? asStr : null;
    };

    const quarterlyCache = await createSessionQuarterlyCache(
      session._id.toString(),
      students.map((s) => ({
        _id: s._id,
        transportRequired: s.transportRequired,
        transportRouteId: s.transportRouteId,
      }))
    );

    const rows = (
      await Promise.all(
        students.map(async (s) => {
          const cid = refId(s.classId);
          if (!cid) return null;
          const report = await buildStudentQuarterlyReport(
            quarterlyCache,
            cid,
            s._id.toString(),
            s.feeDiscount || 0
          );
          if (!report) return null;
          const qData = report.quarters.find((q) => q.quarter === quarter);
          if (!qData) return null;

          return {
            _id: s._id.toString(),
            studentName: s.studentName,
            registrationNumber: s.registrationNumber,
            className: (s.classId as { name?: string })?.name || "—",
            sectionName: (s.sectionId as { name?: string })?.name || "—",
            totalDue: qData.totalDue,
            paid: qData.paid,
            pending: qData.pending,
            status: qData.status,
          };
        })
      )
    ).filter(Boolean) as {
      _id: string;
      studentName: string;
      registrationNumber: string;
      className: string;
      sectionName: string;
      totalDue: number;
      paid: number;
      pending: number;
      status: "paid" | "partial" | "pending";
    }[];

    // Pending first (highest due), then partial, then paid
    const statusRank = { pending: 0, partial: 1, paid: 2 };
    rows.sort((a, b) => {
      const r = statusRank[a.status] - statusRank[b.status];
      if (r !== 0) return r;
      return b.pending - a.pending || a.studentName.localeCompare(b.studentName);
    });

    const summary = {
      due: rows.reduce((s, r) => s + r.totalDue, 0),
      collected: rows.reduce((s, r) => s + r.paid, 0),
      pending: rows.reduce((s, r) => s + r.pending, 0),
      countPaid: rows.filter((r) => r.status === "paid").length,
      countPartial: rows.filter((r) => r.status === "partial").length,
      countPending: rows.filter((r) => r.status === "pending").length,
      totalStudents: rows.length,
    };

    res.json({
      success: true,
      data: {
        session: { _id: session._id.toString(), name: session.name },
        quarter,
        label: QUARTER_LABELS[quarter],
        summary,
        students: rows,
      },
    });
  } catch (error) {
    console.error("getQuarterDetails:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch quarter details",
    });
  }
};

export const getCollectionReport = async (req: AuthRequest, res: Response) => {
  try {
    const { payments, summary, quarterlyStudents } = await fetchCollectionReportData(req.query, req.user);
    res.json({ success: true, data: { payments, summary, quarterlyStudents } });
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

const quarterLabel = (q?: number | null) => {
  if (q && q >= 1 && q <= 4) return QUARTER_LABELS[q as QuarterNumber];
  return "Unassigned";
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
    const breakdown = (p.feeBreakdown || {}) as Record<string, number | boolean | string | undefined>;

    return {
      "S.No": index + 1,
      "Receipt No": p.receiptNumber,
      "Payment Date": formatPaymentDate(p.paymentDate),
      Quarter: quarterLabel(p.quarter),
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
      "Quarterly Tuition": Number(breakdown.quarterlyTuition) || 0,
      "Admission Fee": Number(breakdown.admissionFee) || 0,
      "Tuition (Annual)": Number(breakdown.monthlyFee) || 0,
      "Annual / Development": Number(breakdown.annualFee) || 0,
      "ID Card / Diary": Number(breakdown.computerFee) || 0,
      "Exam Fee": Number(breakdown.examFee) || 0,
      "Tour / Other": Number(breakdown.otherFee) || 0,
      "Transport (11 months)": Number(breakdown.transportFee) || 0,
      "Gross Total": Number(breakdown.grossTotal) || p.totalFee,
      "Total Discount": Number(breakdown.totalDiscount) || 0,
    };
  });

const buildMonthlyCollectionRows = (
  payments: Awaited<ReturnType<typeof fetchCollectionReportData>>["payments"]
) => {
  const months = new Map<
    string,
    {
      sortKey: number;
      month: string;
      count: number;
      amount: number;
      cash: number;
      upi: number;
      card: number;
      cheque: number;
      bankTransfer: number;
    }
  >();

  for (const payment of payments) {
    const date = new Date(payment.paymentDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const row = months.get(key) || {
      sortKey: date.getFullYear() * 12 + date.getMonth(),
      month: date.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
      count: 0,
      amount: 0,
      cash: 0,
      upi: 0,
      card: 0,
      cheque: 0,
      bankTransfer: 0,
    };
    row.count += 1;
    row.amount += payment.currentPayment;
    if (payment.paymentMode === "cash") row.cash += payment.currentPayment;
    else if (payment.paymentMode === "upi") row.upi += payment.currentPayment;
    else if (payment.paymentMode === "card") row.card += payment.currentPayment;
    else if (payment.paymentMode === "cheque") row.cheque += payment.currentPayment;
    else if (payment.paymentMode === "bank_transfer") row.bankTransfer += payment.currentPayment;
    months.set(key, row);
  }

  return [...months.values()]
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((row, index) => ({
      "S.No": index + 1,
      Month: row.month,
      "Collection Count": row.count,
      "Total Collected": row.amount,
      Cash: row.cash,
      UPI: row.upi,
      Card: row.card,
      Cheque: row.cheque,
      "Bank Transfer": row.bankTransfer,
    }));
};

const buildQuarterlyStatusRows = (
  students: Awaited<ReturnType<typeof fetchCollectionReportData>>["quarterlyStudents"]
) =>
  students.map((s, index) => {
    const q1 = s.quarters.find((q) => q.quarter === 1);
    const q2 = s.quarters.find((q) => q.quarter === 2);
    const q3 = s.quarters.find((q) => q.quarter === 3);
    const q4 = s.quarters.find((q) => q.quarter === 4);
    const cell = (q?: { totalDue: number; paid: number; pending: number; status: string }) =>
      q ? `${q.paid}/${q.totalDue} (${q.status})` : "—";

    return {
      "S.No": index + 1,
      "Reg. Number": s.registrationNumber,
      "Student Name": s.studentName,
      Class: s.className,
      Section: s.sectionName,
      "Q1 Due": q1?.totalDue ?? 0,
      "Q1 Paid": q1?.paid ?? 0,
      "Q1 Pending": q1?.pending ?? 0,
      "Q1 Status": q1?.status ?? "—",
      "Q2 Due": q2?.totalDue ?? 0,
      "Q2 Paid": q2?.paid ?? 0,
      "Q2 Pending": q2?.pending ?? 0,
      "Q2 Status": q2?.status ?? "—",
      "Q3 Due": q3?.totalDue ?? 0,
      "Q3 Paid": q3?.paid ?? 0,
      "Q3 Pending": q3?.pending ?? 0,
      "Q3 Status": q3?.status ?? "—",
      "Q4 Due": q4?.totalDue ?? 0,
      "Q4 Paid": q4?.paid ?? 0,
      "Q4 Pending": q4?.pending ?? 0,
      "Q4 Status": q4?.status ?? "—",
      "Total Due": s.totalDue,
      "Total Paid": s.totalPaid,
      "Total Pending": s.totalPending,
      "Overall Status": s.paymentStatus,
      "Q1 Summary": cell(q1),
      "Q2 Summary": cell(q2),
      "Q3 Summary": cell(q3),
      "Q4 Summary": cell(q4),
    };
  });

export const downloadCollectionReportExcel = async (req: AuthRequest, res: Response) => {
  try {
    const { payments, summary, quarterlyStudents } = await fetchCollectionReportData(req.query, req.user);
    const reportBasis = req.query.reportBasis === "monthly" ? "monthly" : "quarterly";
    const rows = buildReportRows(payments);
    const quarterlyRows = buildQuarterlyStatusRows(quarterlyStudents);
    const monthlyRows = buildMonthlyCollectionRows(payments);

    const quarterFilter = (req.query.quarter as string) || "all";
    const summaryRows = [
      {
        Metric: "Report Type",
        Value: reportBasis === "monthly" ? "Monthly Fee Collection Report" : "Quarterly Fee Collection Report",
      },
      { Metric: "Total Collections", Value: summary.totalCollections },
      { Metric: "Total Amount Collected (₹)", Value: summary.totalAmount },
      { Metric: "Report Generated", Value: new Date().toLocaleString("en-IN") },
      { Metric: "Collected By", Value: summary.collectedByName || "All" },
      { Metric: "Quarter Filter", Value: quarterFilter === "all" || !quarterFilter ? "All Quarters" : quarterLabel(Number(quarterFilter)) },
      { Metric: "Session", Value: summary.sessionName || "All Sessions" },
      { Metric: "Class Filter", Value: summary.className || "All Classes" },
      { Metric: "", Value: "" },
      { Metric: "— Quarterly Collection —", Value: "" },
      ...([1, 2, 3, 4] as QuarterNumber[]).map((q) => ({
        Metric: QUARTER_LABELS[q],
        Value: `Collected: ₹${summary.byQuarter[q] || 0} | Due: ₹${summary.quarterTotals[q]?.due || 0} | Pending: ₹${summary.quarterTotals[q]?.pending || 0}`,
      })),
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
    if (reportBasis === "monthly") {
      const monthlySheet = XLSX.utils.json_to_sheet(
        monthlyRows.length > 0
          ? monthlyRows
          : [{ Message: "No monthly collections found for selected filters" }]
      );
      XLSX.utils.book_append_sheet(workbook, monthlySheet, "Monthly Summary");
    } else {
      const quarterlySheet = XLSX.utils.json_to_sheet(
        quarterlyRows.length > 0
          ? quarterlyRows
          : [{ Message: "No students with fee structure found for selected filters" }]
      );
      XLSX.utils.book_append_sheet(workbook, quarterlySheet, "Quarterly Status");
    }
    XLSX.utils.book_append_sheet(workbook, dataSheet, "Collections");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const filename = `${reportBasis}-fee-report-${new Date().toISOString().slice(0, 10)}.xlsx`;

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
  const quarterQuery = query.quarter as string | undefined;
  const classId = query.classId as string | undefined;
  const sessionId = query.sessionId as string | undefined;
  const collectedByQuery = query.collectedBy as string | undefined;
  const needsQuarterlyStatus = query.reportBasis !== "monthly";

  const session = await resolveAcademicSession(sessionId);
  if (!session) {
    return {
      payments: [] as never[],
      summary: {
        totalCollections: 0,
        totalAmount: 0,
        sessionName: "",
        className: "All Classes",
        collectedByName: user?.role === "admin" ? user.name || "You" : "All Admins",
        byQuarter: { 1: 0, 2: 0, 3: 0, 4: 0 },
        quarterTotals: {
          1: { due: 0, collected: 0, pending: 0, countPaid: 0, countPending: 0 },
          2: { due: 0, collected: 0, pending: 0, countPaid: 0, countPending: 0 },
          3: { due: 0, collected: 0, pending: 0, countPaid: 0, countPending: 0 },
          4: { due: 0, collected: 0, pending: 0, countPaid: 0, countPending: 0 },
        },
        byMode: {},
        needsSession: true,
      },
      quarterlyStudents: [],
    };
  }

  const filter: Record<string, unknown> = {
    sessionId: session._id,
    ...activePaymentMatch,
  };

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

  if (quarterQuery && quarterQuery !== "all") {
    const q = parseInt(quarterQuery, 10);
    if (q >= 1 && q <= 4) filter.quarter = q;
  }

  const studentFilter: Record<string, unknown> = { status: "active" };
  if (classId) studentFilter.classId = classId;
  const students =
    needsQuarterlyStatus || classId
      ? await Student.find(studentFilter)
          .select(
            "studentName registrationNumber admissionNumber classId sectionId feeDiscount transportRequired transportRouteId"
          )
          .populate("classId", "name")
          .populate("sectionId", "name")
          .sort({ studentName: 1 })
      : [];

  if (classId) {
    filter.studentId = { $in: students.map((student) => student._id) };
  }

  const payments = await FeePayment.find(filter)
    .select(
      "receiptNumber paymentDate quarter sessionId studentId totalFee previousDue currentPayment paidAmount balance paymentStatus paymentMode collectedBy remarks feeBreakdown"
    )
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
    .sort({ paymentDate: -1 })
    .lean();

  let sessionName = session.name;
  let className = "All Classes";
  if (classId) {
    const { Class } = await import("../models");
    const cls = await Class.findById(classId).select("name");
    className = cls?.name || className;
  }

  const byQuarter = { 1: 0, 2: 0, 3: 0, 4: 0 } as Record<QuarterNumber, number>;
  for (const p of payments) {
    if (p.quarter && p.quarter >= 1 && p.quarter <= 4) {
      byQuarter[p.quarter as QuarterNumber] += p.currentPayment;
    }
  }

  const quarterlyStudents = [];
  if (needsQuarterlyStatus) {
    const quarterlyCache = await createSessionQuarterlyCache(session._id.toString(), students);
    const reports = await Promise.all(
      students.map(async (student) => {
        const classIdStr = student.classId._id.toString();
        const report = await buildStudentQuarterlyReport(
          quarterlyCache,
          classIdStr,
          student._id.toString(),
          student.feeDiscount || 0
        );
        if (!report) return null;

        return {
          _id: student._id.toString(),
          studentName: student.studentName,
          registrationNumber: student.registrationNumber,
          admissionNumber: student.admissionNumber,
          className: (student.classId as { name?: string })?.name || "—",
          sectionName: (student.sectionId as { name?: string })?.name || "—",
          ...report,
        };
      })
    );
    quarterlyStudents.push(...reports.filter((report): report is NonNullable<typeof report> => report !== null));
  }

  const quarterTotals = aggregateQuarterlyTotals(quarterlyStudents);

  const summary = {
    totalCollections: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + p.currentPayment, 0),
    sessionName,
    className,
    collectedByName,
    byQuarter,
    quarterTotals,
    byMode: payments.reduce(
      (acc, p) => {
        acc[p.paymentMode] = (acc[p.paymentMode] || 0) + p.currentPayment;
        return acc;
      },
      {} as Record<string, number>
    ),
  };

  return { payments, summary, quarterlyStudents };
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
