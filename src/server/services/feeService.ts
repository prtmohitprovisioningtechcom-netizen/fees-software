import { Types } from "mongoose";
import { FeeStructure, FeePayment } from "../models";
import { FeeCalculation } from "@/types";

export const calculateFee = async (
  studentId: string,
  sessionId: string,
  classId: string,
  currentPayment: number,
  transportRequired: boolean
): Promise<FeeCalculation> => {
  const feeStructure = await FeeStructure.findOne({
    classId: new Types.ObjectId(classId),
    sessionId: new Types.ObjectId(sessionId),
  });

  if (!feeStructure) {
    throw new Error("Fee structure not found for this class and session");
  }

  const feeBreakdown = {
    admissionFee: feeStructure.admissionFee,
    monthlyFee: feeStructure.monthlyFee * 12,
    computerFee: feeStructure.computerFee,
    examFee: feeStructure.examFee,
    transportFee: 0,
    otherFee: feeStructure.otherFee,
  };

  const totalFee = Object.values(feeBreakdown).reduce((sum, val) => sum + val, 0);

  const payments = await FeePayment.find({
    studentId: new Types.ObjectId(studentId),
    sessionId: new Types.ObjectId(sessionId),
  });

  const paidAmount = payments.reduce((sum, p) => sum + p.currentPayment, 0);
  const remainingAmount = Math.max(0, totalFee - paidAmount);
  const previousDue = remainingAmount;
  const balance = Math.max(0, previousDue - currentPayment);
  const newPaidTotal = paidAmount + currentPayment;

  let paymentStatus: "paid" | "partial" | "pending" = "pending";
  if (newPaidTotal >= totalFee) paymentStatus = "paid";
  else if (newPaidTotal > 0) paymentStatus = "partial";

  return {
    totalFee,
    paidAmount: newPaidTotal,
    remainingAmount: balance,
    previousDue,
    currentPayment,
    balance,
    paymentStatus,
    feeBreakdown,
  };
};

export const generateRegistrationNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `REG${year}`;
  const { Student } = await import("../models");
  const last = await Student.findOne({ registrationNumber: new RegExp(`^${prefix}`) })
    .sort({ registrationNumber: -1 })
    .select("registrationNumber");

  let seq = 1;
  if (last?.registrationNumber) {
    const num = parseInt(last.registrationNumber.replace(prefix, ""), 10);
    if (!isNaN(num)) seq = num + 1;
  }
  return `${prefix}${String(seq).padStart(5, "0")}`;
};

export const generateReceiptNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `RCP${year}`;
  const last = await FeePayment.findOne({ receiptNumber: new RegExp(`^${prefix}`) })
    .sort({ receiptNumber: -1 })
    .select("receiptNumber");

  let seq = 1;
  if (last?.receiptNumber) {
    const num = parseInt(last.receiptNumber.replace(prefix, ""), 10);
    if (!isNaN(num)) seq = num + 1;
  }
  return `${prefix}${String(seq).padStart(5, "0")}`;
};
