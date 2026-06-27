import { Response } from "express";
import { Types } from "mongoose";
import { FeePayment, Student, FeeStructure } from "../models";
import { AuthRequest } from "../middleware/auth";
import { calculateFee, generateReceiptNumber } from "../services/feeService";

export const getStudentFeeSummary = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .populate("classId", "name")
      .populate("sectionId", "name")
      .populate("sessionId", "name");

    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const calculation = await calculateFee(
      student._id.toString(),
      student.sessionId._id.toString(),
      student.classId._id.toString(),
      0,
      student.transportRequired
    );

    const feeStructure = await FeeStructure.findOne({
      classId: student.classId._id,
      sessionId: student.sessionId._id,
    });

    const payments = await FeePayment.find({ studentId: student._id })
      .populate("collectedBy", "name")
      .sort({ paymentDate: -1 });

    res.json({
      success: true,
      data: { student, feeStructure, calculation, payments },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch fee summary";
    res.status(400).json({ success: false, message });
  }
};

export const collectFee = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, paymentAmount, paymentMode, remarks } = req.body;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const feeStructure = await FeeStructure.findOne({
      classId: student.classId,
      sessionId: student.sessionId,
    });
    if (!feeStructure) return res.status(404).json({ success: false, message: "Fee structure not found" });

    const calculation = await calculateFee(
      studentId,
      student.sessionId.toString(),
      student.classId.toString(),
      paymentAmount,
      student.transportRequired
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
      sessionId: student.sessionId,
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

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { receiptNumber: { $regex: search, $options: "i" } },
      ];
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
