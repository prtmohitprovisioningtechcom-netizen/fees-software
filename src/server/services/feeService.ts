import { Types } from "mongoose";
import { FeeStructure, FeePayment } from "../models";
import { FeeCalculation } from "@/types";

type StructureLike = {
  admissionFee: number;
  monthlyFee: number;
  annualFee?: number;
  computerFee: number;
  examFee: number;
  otherFee: number;
  discount?: number;
};

export const getGrossStructureTotal = (structure: StructureLike) =>
  structure.admissionFee +
  structure.monthlyFee * 12 +
  (structure.annualFee || 0) +
  structure.computerFee +
  structure.examFee +
  structure.otherFee;

export const computeNetFee = (structure: StructureLike, studentFeeDiscount = 0) => {
  const grossTotal = getGrossStructureTotal(structure);
  const structureDiscount = structure.discount || 0;
  const studentDiscount = studentFeeDiscount || 0;
  const totalDiscount = Math.min(grossTotal, structureDiscount + studentDiscount);
  const netTotal = grossTotal - totalDiscount;

  return { grossTotal, structureDiscount, studentDiscount, totalDiscount, netTotal };
};

export const calculateFee = async (
  studentId: string,
  sessionId: string,
  classId: string,
  currentPayment: number,
  transportRequired: boolean,
  studentFeeDiscount = 0
): Promise<FeeCalculation> => {
  const feeStructure = await FeeStructure.findOne({
    classId: new Types.ObjectId(classId),
    sessionId: new Types.ObjectId(sessionId),
  });

  if (!feeStructure) {
    throw new Error("Fee structure not found for this class and session");
  }

  const { grossTotal, structureDiscount, studentDiscount, totalDiscount, netTotal } = computeNetFee(
    feeStructure,
    studentFeeDiscount
  );

  const feeBreakdown = {
    admissionFee: feeStructure.admissionFee,
    monthlyFee: feeStructure.monthlyFee * 12,
    annualFee: feeStructure.annualFee || 0,
    computerFee: feeStructure.computerFee,
    examFee: feeStructure.examFee,
    transportFee: 0,
    otherFee: feeStructure.otherFee,
    grossTotal,
    structureDiscount,
    studentDiscount,
    totalDiscount,
  };

  const payments = await FeePayment.find({
    studentId: new Types.ObjectId(studentId),
    sessionId: new Types.ObjectId(sessionId),
  });

  const paidAmount = payments.reduce((sum, p) => sum + p.currentPayment, 0);
  const remainingAmount = Math.max(0, netTotal - paidAmount);
  const previousDue = remainingAmount;
  const balance = Math.max(0, previousDue - currentPayment);
  const newPaidTotal = paidAmount + currentPayment;

  let paymentStatus: "paid" | "partial" | "pending" = "pending";
  if (newPaidTotal >= netTotal) paymentStatus = "paid";
  else if (newPaidTotal > 0) paymentStatus = "partial";

  return {
    totalFee: netTotal,
    grossTotal,
    totalDiscount,
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

/** @deprecated use getGrossStructureTotal */
export const getStructureTotalFee = getGrossStructureTotal;

export type SessionFeeCache = {
  structuresByClass: Map<string, StructureLike>;
  paidByStudent: Map<string, number>;
};

export const createSessionFeeCache = async (sessionId: string): Promise<SessionFeeCache> => {
  const sessionOid = new Types.ObjectId(sessionId);
  const [structures, paidAgg] = await Promise.all([
    FeeStructure.find({ sessionId: sessionOid })
      .select("classId admissionFee monthlyFee annualFee computerFee examFee otherFee discount")
      .lean(),
    FeePayment.aggregate<{ _id: Types.ObjectId; paidAmount: number }>([
      { $match: { sessionId: sessionOid } },
      { $group: { _id: "$studentId", paidAmount: { $sum: "$currentPayment" } } },
    ]),
  ]);

  return {
    structuresByClass: new Map(structures.map((s) => [s.classId.toString(), s])),
    paidByStudent: new Map(paidAgg.map((p) => [p._id.toString(), p.paidAmount])),
  };
};

export const getFeeStatusFromCache = (
  cache: SessionFeeCache,
  classId: string,
  studentId: string,
  studentFeeDiscount = 0
) => {
  const structure = cache.structuresByClass.get(classId);
  if (!structure) {
    return {
      grossTotal: 0,
      totalDiscount: 0,
      totalFee: 0,
      paidAmount: 0,
      pendingAmount: 0,
      paymentStatus: "pending" as const,
      hasFeeStructure: false,
    };
  }

  const { grossTotal, totalDiscount, netTotal } = computeNetFee(structure, studentFeeDiscount);
  const paidAmount = cache.paidByStudent.get(studentId) || 0;
  const pendingAmount = Math.max(0, netTotal - paidAmount);

  let paymentStatus: "paid" | "partial" | "pending" = "pending";
  if (paidAmount >= netTotal) paymentStatus = "paid";
  else if (paidAmount > 0) paymentStatus = "partial";

  return {
    grossTotal,
    totalDiscount,
    totalFee: netTotal,
    paidAmount,
    pendingAmount,
    paymentStatus,
    hasFeeStructure: true,
  };
};

export const getStudentSessionFeeStatus = async (
  studentId: string,
  sessionId: string,
  classId: string,
  studentFeeDiscount = 0
) => {
  const feeStructure = await FeeStructure.findOne({
    classId: new Types.ObjectId(classId),
    sessionId: new Types.ObjectId(sessionId),
  })
    .select("admissionFee monthlyFee annualFee computerFee examFee otherFee discount")
    .lean();

  if (!feeStructure) {
    return {
      grossTotal: 0,
      totalDiscount: 0,
      totalFee: 0,
      paidAmount: 0,
      pendingAmount: 0,
      paymentStatus: "pending" as const,
      hasFeeStructure: false,
    };
  }

  const paidAgg = await FeePayment.aggregate<{ paidAmount: number }>([
    {
      $match: {
        studentId: new Types.ObjectId(studentId),
        sessionId: new Types.ObjectId(sessionId),
      },
    },
    { $group: { _id: null, paidAmount: { $sum: "$currentPayment" } } },
  ]);

  const { grossTotal, totalDiscount, netTotal } = computeNetFee(feeStructure, studentFeeDiscount);
  const paidAmount = paidAgg[0]?.paidAmount || 0;
  const pendingAmount = Math.max(0, netTotal - paidAmount);

  let paymentStatus: "paid" | "partial" | "pending" = "pending";
  if (paidAmount >= netTotal) paymentStatus = "paid";
  else if (paidAmount > 0) paymentStatus = "partial";

  return {
    grossTotal,
    totalDiscount,
    totalFee: netTotal,
    paidAmount,
    pendingAmount,
    paymentStatus,
    hasFeeStructure: true,
  };
};
