import { Response } from "express";
import { Types } from "mongoose";
import { AcademicSession, FeePayment, Student, FeeStructure } from "../models";
import { AuthRequest } from "../middleware/auth";
import {
  calculateFee,
  generateReceiptNumber,
  createSessionFeeCache,
  getFeeStatusFromCache,
  resolveStudentTransport,
  buildStudentTransportMap,
  getStudentSessionArrears,
  regularPaymentMatch,
} from "../services/feeService";
import { resolveAcademicSession } from "../services/sessionService";

const resolveSessionId = resolveAcademicSession;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const emptyFeeBreakdown = (amount: number) => ({
  admissionFee: 0,
  monthlyFee: 0,
  quarterlyTuition: 0,
  annualFee: 0,
  computerFee: 0,
  examFee: 0,
  transportFee: 0,
  transportRouteName: "",
  otherFee: amount,
  annualCharges: 0,
  grossTotal: amount,
  structureDiscount: 0,
  studentDiscount: 0,
  totalDiscount: 0,
  includeAdmission: false,
});

export const getStudentFeeSummary = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .populate("classId", "name")
      .populate("sectionId", "name")
      .populate("sessionId", "name")
      .populate("transportRouteId", "name monthlyFee");

    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const session = await resolveSessionId((req.query.sessionId as string) || student.sessionId.toString());
    if (!session) {
      return res.status(400).json({ success: false, message: "Academic session not found" });
    }

    const feeStructure = await FeeStructure.findOne({
      classId: student.classId._id,
      sessionId: session._id,
    });

    const transport = await resolveStudentTransport(student.transportRequired, student.transportRouteId);
    let calculation: Awaited<ReturnType<typeof calculateFee>> | null = null;
    const includeAdmission = req.query.includeAdmission === "true";
    if (feeStructure) {
      calculation = await calculateFee(
        student._id.toString(),
        session._id.toString(),
        student.classId._id.toString(),
        0,
        transport,
        student.feeDiscount || 0,
        includeAdmission
      );
    }

    const sessionRef = student.sessionId as unknown as { _id?: { toString: () => string }; toString: () => string };
    const enrolledSessionId = sessionRef._id ? sessionRef._id.toString() : sessionRef.toString();

    const [payments, sessionArrears] = await Promise.all([
      FeePayment.find({ studentId: student._id })
        .populate("collectedBy", "name")
        .populate("sessionId", "name")
        .sort({ paymentDate: -1 }),
      getStudentSessionArrears(
        student._id.toString(),
        student.classId._id.toString(),
        enrolledSessionId,
        student.feeDiscount || 0,
        transport,
        session._id.toString()
      ),
    ]);

    res.json({
      success: true,
      data: {
        student,
        session: { _id: session._id, name: session.name },
        feeStructure,
        calculation,
        payments,
        sessionArrears,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch fee summary";
    res.status(500).json({ success: false, message });
  }
};

export const getStudentsFeeOverview = async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = ((req.query.search as string) || "").trim();
    const classIdRaw = (req.query.classId as string) || "";
    const sectionIdRaw = (req.query.sectionId as string) || "";

    const session = await resolveSessionId(req.query.sessionId as string);
    if (!session) {
      return res.status(400).json({ success: false, message: "Academic session not found" });
    }

    const parseOid = (value: string) => {
      if (!value || value === "all" || value === "undefined" || value === "null") return null;
      return /^[a-fA-F0-9]{24}$/.test(value) ? new Types.ObjectId(value) : null;
    };

    const classOid = parseOid(classIdRaw);
    const sectionOid = parseOid(sectionIdRaw);

    const filter: Record<string, unknown> = { status: "active" };
    if (classOid) filter.classId = classOid;
    if (sectionOid) filter.sectionId = sectionOid;
    if (search) {
      filter.$or = [
        { studentName: { $regex: search, $options: "i" } },
        { registrationNumber: { $regex: search, $options: "i" } },
        { admissionNumber: { $regex: search, $options: "i" } },
        { fatherName: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } },
      ];
    }

    const [total, students, feeCache] = await Promise.all([
      Student.countDocuments(filter),
      Student.find(filter)
        .select(
          "registrationNumber admissionNumber studentName fatherName mobileNumber classId sectionId transportRequired transportRouteId feeDiscount"
        )
        .populate("classId", "name")
        .populate("sectionId", "name")
        .populate("transportRouteId", "name monthlyFee")
        .sort({ studentName: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      createSessionFeeCache(session._id.toString()),
    ]);

    // Uses populated routes in-memory — no extra route query / no CastError
    const transportMap = await buildStudentTransportMap(students);

    const data = students.map((student) => {
      const classIdStr =
        student.classId && typeof student.classId === "object" && "_id" in student.classId
          ? String((student.classId as { _id: unknown })._id)
          : student.classId
            ? String(student.classId)
            : null;

      const feeStatus = classIdStr
        ? getFeeStatusFromCache(
            feeCache,
            classIdStr,
            student._id.toString(),
            student.feeDiscount || 0,
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
        _id: student._id,
        registrationNumber: student.registrationNumber,
        admissionNumber: student.admissionNumber,
        studentName: student.studentName,
        fatherName: student.fatherName,
        mobileNumber: student.mobileNumber,
        classId: student.classId || { _id: "", name: "—" },
        sectionId: student.sectionId || { _id: "", name: "—" },
        sessionId: session._id,
        sessionName: session.name,
        transportRequired: student.transportRequired,
        transportRouteId: student.transportRouteId,
        grossTotal: feeStatus.grossTotal,
        totalDiscount: feeStatus.totalDiscount,
        feeDiscount: student.feeDiscount || 0,
        totalFee: feeStatus.totalFee,
        paidAmount: feeStatus.paidAmount,
        pendingAmount: feeStatus.pendingAmount,
        paymentStatus: feeStatus.paymentStatus,
        hasFeeStructure: feeStatus.hasFeeStructure,
      };
    });

    res.json({
      success: true,
      data,
      session: { _id: session._id, name: session.name },
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error("getStudentsFeeOverview:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch student fees",
    });
  }
};

export const collectFee = async (req: AuthRequest, res: Response) => {
  try {
    const {
      studentId,
      paymentAmount,
      paymentMode,
      remarks,
      sessionId: bodySessionId,
      sessionName,
      previousDues,
      feeDiscount,
      quarter,
      paymentType,
      includeAdmission,
    } = req.body;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const customSessionName = String(sessionName || "").trim();
    if (previousDues && customSessionName) {
      if (feeDiscount !== undefined && feeDiscount !== null && feeDiscount !== "") {
        student.feeDiscount = Math.max(0, Number(feeDiscount) || 0);
        await student.save();
      }

      const matchedSession = await AcademicSession.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(customSessionName)}$`, "i") },
        isActive: true,
      });

      const enrolledSession = await resolveSessionId(student.sessionId.toString());
      const anchorSession = enrolledSession || (await resolveSessionId(bodySessionId || ""));
      if (!anchorSession) {
        return res.status(400).json({ success: false, message: "Academic session not found" });
      }

      let feeStructure = await FeeStructure.findOne({
        classId: student.classId,
        sessionId: matchedSession?._id ?? anchorSession._id,
      });
      if (!feeStructure) {
        feeStructure = await FeeStructure.findOne({ classId: student.classId });
      }
      if (!feeStructure) {
        return res.status(404).json({ success: false, message: "Fee structure not found for this class" });
      }

      const transport = await resolveStudentTransport(student.transportRequired, student.transportRouteId);
      const amount = Number(paymentAmount);
      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: "Payment amount must be greater than 0" });
      }

      let paymentFields: Record<string, unknown>;
      let isStandalonePreviousDues = false;

      if (matchedSession) {
        const priorPayments = await FeePayment.find({
          studentId: student._id,
          sessionId: matchedSession._id,
          ...regularPaymentMatch,
        })
          .select("feeBreakdown")
          .lean();
        const includeAdmissionForSession = priorPayments.some((p) => {
          const b = p.feeBreakdown as { includeAdmission?: boolean; admissionFee?: number } | undefined;
          return Boolean(b?.includeAdmission || (b?.admissionFee ?? 0) > 0);
        });

        const calculation = await calculateFee(
          studentId,
          matchedSession._id.toString(),
          student.classId.toString(),
          amount,
          transport,
          student.feeDiscount || 0,
          includeAdmissionForSession
        );

        if (amount > calculation.previousDue) {
          return res.status(400).json({
            success: false,
            message: `Payment amount cannot exceed due amount of ₹${calculation.previousDue}`,
          });
        }

        paymentFields = {
          sessionId: matchedSession._id,
          totalFee: calculation.totalFee,
          paidAmount: calculation.paidAmount,
          remainingAmount: calculation.remainingAmount,
          previousDue: calculation.previousDue,
          currentPayment: calculation.currentPayment,
          balance: calculation.balance,
          paymentStatus: calculation.paymentStatus,
          feeBreakdown: calculation.feeBreakdown,
        };
      } else {
        isStandalonePreviousDues = true;
        paymentFields = {
          sessionId: anchorSession._id,
          totalFee: amount,
          paidAmount: amount,
          remainingAmount: 0,
          previousDue: amount,
          currentPayment: amount,
          balance: 0,
          paymentStatus: "paid",
          feeBreakdown: emptyFeeBreakdown(amount),
        };
      }

      const receiptNumber = await generateReceiptNumber();
      const payment = await FeePayment.create({
        receiptNumber,
        studentId: new Types.ObjectId(studentId),
        feeStructureId: feeStructure._id,
        paymentMode,
        remarks: remarks || `Previous session dues — ${customSessionName}`,
        paymentType: "custom",
        collectedBy: req.user?.id,
        customSessionName,
        isStandalonePreviousDues,
        ...paymentFields,
      });

      await payment.populate([
        { path: "studentId", populate: [{ path: "classId" }, { path: "sectionId" }] },
        { path: "collectedBy", select: "name" },
      ]);

      return res.status(201).json({
        success: true,
        message: "Previous session fee collected successfully",
        data: {
          _id: payment._id.toString(),
          id: payment._id.toString(),
          receiptNumber: payment.receiptNumber,
          customSessionName,
        },
      });
    }

    if (feeDiscount !== undefined && feeDiscount !== null && feeDiscount !== "") {
      student.feeDiscount = Math.max(0, Number(feeDiscount) || 0);
      await student.save();
    }

    const session = await resolveSessionId(bodySessionId || student.sessionId.toString());
    if (!session) return res.status(400).json({ success: false, message: "Academic session not found" });

    const feeStructure = await FeeStructure.findOne({
      classId: student.classId,
      sessionId: session._id,
    });
    if (!feeStructure) return res.status(404).json({ success: false, message: "Fee structure not found for this class and session" });

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Payment amount must be greater than 0" });
    }

    const calculation = await calculateFee(
      studentId,
      session._id.toString(),
      student.classId.toString(),
      amount,
      await resolveStudentTransport(student.transportRequired, student.transportRouteId),
      student.feeDiscount || 0,
      Boolean(includeAdmission)
    );

    if (amount > calculation.previousDue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed due amount of ₹${calculation.previousDue}`,
      });
    }

    let resolvedQuarter = quarter ? Number(quarter) : undefined;
    if (!resolvedQuarter) {
      const oldestPending = (calculation.quarterlySchedule || []).find((q) => q.pending > 0);
      if (oldestPending) resolvedQuarter = oldestPending.quarter;
    }

    const receiptNumber = await generateReceiptNumber();

    const payment = await FeePayment.create({
      receiptNumber,
      studentId: new Types.ObjectId(studentId),
      sessionId: session._id,
      feeStructureId: feeStructure._id,
      totalFee: calculation.totalFee,
      paidAmount: calculation.paidAmount,
      remainingAmount: calculation.remainingAmount,
      previousDue: calculation.previousDue,
      currentPayment: calculation.currentPayment,
      balance: calculation.balance,
      paymentStatus: calculation.paymentStatus,
      paymentMode,
      remarks,
      quarter: resolvedQuarter || undefined,
      paymentType: paymentType || (resolvedQuarter ? "quarterly" : "custom"),
      collectedBy: req.user?.id,
      feeBreakdown: calculation.feeBreakdown,
    });

    await payment.populate([
      { path: "studentId", populate: [{ path: "classId" }, { path: "sectionId" }] },
      { path: "collectedBy", select: "name" },
    ]);

    res.status(201).json({
      success: true,
      message: "Fee collected successfully",
      data: {
        _id: payment._id.toString(),
        id: payment._id.toString(),
        receiptNumber: payment.receiptNumber,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to collect fee", error: String(error) });
  }
};

export const getPayment = async (req: AuthRequest, res: Response) => {
  try {
    const payment = await FeePayment.findById(req.params.id)
      .populate({
        path: "studentId",
        populate: [{ path: "classId", select: "name" }, { path: "sectionId", select: "name" }],
      })
      .populate("sessionId", "name")
      .populate("collectedBy", "name");

    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch payment", error: String(error) });
  }
};

export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const sessionId = req.query.sessionId as string;

    const filter: Record<string, unknown> = {};
    if (sessionId) filter.sessionId = sessionId;
    if (search) {
      filter.$or = [{ receiptNumber: { $regex: search, $options: "i" } }];
    }

    const total = await FeePayment.countDocuments(filter);
    const payments = await FeePayment.find(filter)
      .populate({
        path: "studentId",
        select: "studentName registrationNumber",
        populate: { path: "classId", select: "name" },
      })
      .populate("collectedBy", "name")
      .sort({ paymentDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch payments", error: String(error) });
  }
};
