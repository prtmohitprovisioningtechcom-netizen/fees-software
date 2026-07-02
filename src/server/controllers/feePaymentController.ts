import { Response } from "express";
import { Types } from "mongoose";
import { AcademicSession, FeePayment, Student, FeeStructure } from "../models";
import { AuthRequest } from "../middleware/auth";
import { calculateFee, generateReceiptNumber, createSessionFeeCache, getFeeStatusFromCache } from "../services/feeService";
import { resolveAcademicSession } from "../services/sessionService";

const resolveSessionId = resolveAcademicSession;

export const getStudentFeeSummary = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .populate("classId", "name")
      .populate("sectionId", "name")
      .populate("sessionId", "name");

    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const session = await resolveSessionId((req.query.sessionId as string) || student.sessionId.toString());
    if (!session) {
      return res.status(400).json({ success: false, message: "Academic session not found" });
    }

    const feeStructure = await FeeStructure.findOne({
      classId: student.classId._id,
      sessionId: session._id,
    });

    let calculation: Awaited<ReturnType<typeof calculateFee>> | null = null;
    const includeAdmission = req.query.includeAdmission === "true";
    if (feeStructure) {
      calculation = await calculateFee(
        student._id.toString(),
        session._id.toString(),
        student.classId._id.toString(),
        0,
        student.transportRequired,
        student.feeDiscount || 0,
        includeAdmission
      );
    }

    const payments = await FeePayment.find({ studentId: student._id, sessionId: session._id })
      .populate("collectedBy", "name")
      .sort({ paymentDate: -1 });

    res.json({
      success: true,
      data: {
        student,
        session: { _id: session._id, name: session.name },
        feeStructure,
        calculation,
        payments,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch fee summary";
    res.status(500).json({ success: false, message });
  }
};

export const getStudentsFeeOverview = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || "";
    const classId = req.query.classId as string;
    const sectionId = req.query.sectionId as string;

    const session = await resolveSessionId(req.query.sessionId as string);
    if (!session) {
      return res.status(400).json({ success: false, message: "Academic session not found" });
    }

    const filter: Record<string, unknown> = { status: "active" };
    if (classId) filter.classId = classId;
    if (sectionId) filter.sectionId = sectionId;
    if (search) {
      filter.$or = [
        { studentName: { $regex: search, $options: "i" } },
        { registrationNumber: { $regex: search, $options: "i" } },
        { admissionNumber: { $regex: search, $options: "i" } },
        { fatherName: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Student.countDocuments(filter);
    const [students, feeCache] = await Promise.all([
      Student.find(filter)
        .populate("classId", "name")
        .populate("sectionId", "name")
        .sort({ studentName: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      createSessionFeeCache(session._id.toString()),
    ]);

    const data = students.map((student) => {
      const feeStatus = getFeeStatusFromCache(
        feeCache,
        student.classId._id.toString(),
        student._id.toString(),
        student.feeDiscount || 0,
        student.transportRequired
      );
      return {
        _id: student._id,
        registrationNumber: student.registrationNumber,
        admissionNumber: student.admissionNumber,
        studentName: student.studentName,
        fatherName: student.fatherName,
        mobileNumber: student.mobileNumber,
        classId: student.classId,
        sectionId: student.sectionId,
        sessionId: session._id,
        sessionName: session.name,
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
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch student fees", error: String(error) });
  }
};

export const collectFee = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, paymentAmount, paymentMode, remarks, sessionId: bodySessionId, feeDiscount, quarter, paymentType, includeAdmission } = req.body;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

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

    const calculation = await calculateFee(
      studentId,
      session._id.toString(),
      student.classId.toString(),
      paymentAmount,
      student.transportRequired,
      student.feeDiscount || 0,
      Boolean(includeAdmission)
    );

    if (paymentAmount > calculation.previousDue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed due amount of ₹${calculation.previousDue}`,
      });
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
      quarter: quarter || undefined,
      paymentType: paymentType || (quarter ? "quarterly" : "custom"),
      collectedBy: req.user?.id,
      feeBreakdown: calculation.feeBreakdown,
    });

    await payment.populate([
      { path: "studentId", populate: [{ path: "classId" }, { path: "sectionId" }] },
      { path: "collectedBy", select: "name" },
    ]);

    res.status(201).json({ success: true, message: "Fee collected successfully", data: payment });
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
