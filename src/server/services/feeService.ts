import { Types } from "mongoose";
import { FeeStructure, FeePayment, TransportRoute, AcademicSession, AppSetting } from "../models";
import { FeeCalculation } from "@/types";
import {
  finalizeQuarterSchedule,
  getAnnualChargesTotal,
  getGrossYearlyTotal,
  getQuarterlyTuition,
  getYearlyTuition,
  getYearlyTransport,
  sumSchedulePending,
  type FeeStructureAmounts,
  type QuarterNumber,
  type QuarterScheduleItem,
  type TransportInfo,
} from "@/lib/fee-schedule";
import { mergeFeePolicy, type FeePolicy } from "@/lib/fee-policy";

export type SessionArrear = {
  sessionId: string;
  sessionName: string;
  isCurrent: boolean;
  startDate: Date;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  hasFeeStructure: boolean;
};

export type StructureLike = FeeStructureAmounts;

export type { TransportInfo };

/** Standalone previous-dues slips must not affect regular session balance math. */
export const regularPaymentMatch = {
  isStandalonePreviousDues: { $ne: true },
};

let cachedPolicy: { policy: FeePolicy; at: number } | null = null;
const POLICY_CACHE_MS = 30_000;

export const clearFeePolicyCache = () => {
  cachedPolicy = null;
};

export const getFeePolicy = async (): Promise<FeePolicy> => {
  const now = Date.now();
  if (cachedPolicy && now - cachedPolicy.at < POLICY_CACHE_MS) {
    return cachedPolicy.policy;
  }
  const settings = await AppSetting.findOne().select("feePolicy").lean();
  const policy = mergeFeePolicy(settings?.feePolicy as FeePolicy | undefined);
  cachedPolicy = { policy, at: now };
  return policy;
};

/** Normalize ObjectId / string / populated `{ _id }` to a 24-char hex id. */
export const toObjectIdString = (value: unknown): string | null => {
  if (value == null) return null;
  if (typeof value === "string") {
    return /^[a-fA-F0-9]{24}$/.test(value) ? value : null;
  }
  if (value instanceof Types.ObjectId) return value.toString();
  if (typeof value === "object") {
    const nested = (value as { _id?: unknown })._id;
    if (nested != null && nested !== value) return toObjectIdString(nested);
    if (typeof (value as { toHexString?: () => string }).toHexString === "function") {
      try {
        const hex = (value as { toHexString: () => string }).toHexString();
        return /^[a-fA-F0-9]{24}$/.test(hex) ? hex : null;
      } catch {
        return null;
      }
    }
  }
  return null;
};

export const resolveStudentTransport = async (
  transportRequired: boolean,
  transportRouteId?: Types.ObjectId | string | { _id?: unknown } | null
): Promise<TransportInfo> => {
  if (!transportRequired || !transportRouteId) return null;
  if (typeof transportRouteId === "object" && transportRouteId !== null && "monthlyFee" in transportRouteId) {
    const populated = transportRouteId as { name?: string; monthlyFee?: number };
    if (typeof populated.monthlyFee === "number") {
      return { monthlyFee: populated.monthlyFee, routeName: populated.name || "" };
    }
  }
  const routeId = toObjectIdString(transportRouteId);
  if (!routeId) return null;
  const route = await TransportRoute.findOne({ _id: routeId, isActive: true }).lean();
  if (!route) return null;
  return { monthlyFee: route.monthlyFee, routeName: route.name };
};

export const buildStudentTransportMap = async (
  students: {
    _id: Types.ObjectId | string;
    transportRequired?: boolean;
    transportRouteId?: Types.ObjectId | string | { _id?: unknown; name?: string; monthlyFee?: number } | null;
  }[]
): Promise<Map<string, TransportInfo>> => {
  const map = new Map<string, TransportInfo>();
  const missingRouteIds = new Set<string>();

  for (const student of students) {
    const sid = student._id.toString();
    if (!student.transportRequired || !student.transportRouteId) {
      map.set(sid, null);
      continue;
    }

    const routeRef = student.transportRouteId;
    // Use populated route directly — avoids second query + CastError on .toString()
    if (typeof routeRef === "object" && routeRef !== null && typeof (routeRef as { monthlyFee?: number }).monthlyFee === "number") {
      map.set(sid, {
        monthlyFee: (routeRef as { monthlyFee: number }).monthlyFee,
        routeName: (routeRef as { name?: string }).name || "",
      });
      continue;
    }

    const routeId = toObjectIdString(routeRef);
    if (!routeId) {
      map.set(sid, null);
      continue;
    }
    missingRouteIds.add(routeId);
    map.set(sid, null); // placeholder until DB fill
  }

  if (missingRouteIds.size === 0) return map;

  const routes = await TransportRoute.find({
    _id: { $in: [...missingRouteIds] },
    isActive: true,
  })
    .select("name monthlyFee")
    .lean();

  const routeById = new Map(
    routes.map((r) => [r._id.toString(), { monthlyFee: r.monthlyFee, routeName: r.name } as TransportInfo])
  );

  for (const student of students) {
    if (!student.transportRequired || !student.transportRouteId) continue;
    const sid = student._id.toString();
    if (map.get(sid)) continue; // already filled from populate
    const routeId = toObjectIdString(student.transportRouteId);
    if (routeId) map.set(sid, routeById.get(routeId) || null);
  }

  return map;
};

export const getGrossStructureTotal = (
  structure: StructureLike,
  includeAdmission = false,
  transport: TransportInfo = null
) => getGrossYearlyTotal(structure, includeAdmission, transport);

export const computeNetFee = (
  structure: StructureLike,
  studentFeeDiscount = 0,
  includeAdmission = false,
  transport: TransportInfo = null
) => {
  const grossTotal = getGrossYearlyTotal(structure, includeAdmission, transport);
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
  transport: TransportInfo,
  studentFeeDiscount = 0,
  includeAdmission = false
): Promise<FeeCalculation> => {
  const feeStructure = await FeeStructure.findOne({
    classId: new Types.ObjectId(classId),
    sessionId: new Types.ObjectId(sessionId),
  });

  if (!feeStructure) {
    throw new Error("Fee structure not found for this class and session");
  }

  const payments = await FeePayment.find({
    studentId: new Types.ObjectId(studentId),
    sessionId: new Types.ObjectId(sessionId),
    ...regularPaymentMatch,
  })
    .select("currentPayment quarter feeBreakdown.includeAdmission feeBreakdown.admissionFee")
    .lean();

  const effectiveIncludeAdmission =
    includeAdmission ||
    payments.some((payment) => {
      const breakdown = payment.feeBreakdown as
        | { includeAdmission?: boolean; admissionFee?: number }
        | undefined;
      return Boolean(breakdown?.includeAdmission || (breakdown?.admissionFee ?? 0) > 0);
    });
  const structure = feeStructure.toObject() as StructureLike;
  const { grossTotal, structureDiscount, studentDiscount, totalDiscount, netTotal } = computeNetFee(
    structure,
    studentFeeDiscount,
    effectiveIncludeAdmission,
    transport
  );

  const feePolicy = await getFeePolicy();

  const quarterlySchedule = finalizeQuarterSchedule(
    structure,
    effectiveIncludeAdmission,
    payments,
    totalDiscount,
    feePolicy,
    transport
  );

  const yearlyTransport = transport ? getYearlyTransport(transport.monthlyFee) : 0;

  const feeBreakdown = {
    admissionFee: effectiveIncludeAdmission ? structure.admissionFee : 0,
    monthlyFee: getYearlyTuition(structure.monthlyFee),
    quarterlyTuition: getQuarterlyTuition(structure.monthlyFee),
    annualFee: structure.annualFee || 0,
    computerFee: structure.computerFee,
    examFee: structure.examFee,
    transportFee: yearlyTransport,
    transportRouteName: transport?.routeName || "",
    otherFee: structure.otherFee,
    annualCharges: getAnnualChargesTotal(structure),
    grossTotal,
    structureDiscount,
    studentDiscount,
    totalDiscount,
    includeAdmission: effectiveIncludeAdmission,
  };

  const paidAmountBefore = payments.reduce((sum, p) => sum + p.currentPayment, 0);
  const previousDue = Math.max(0, netTotal - paidAmountBefore);
  const balance = Math.max(0, previousDue - currentPayment);
  const newPaidTotal = paidAmountBefore + currentPayment;

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
    quarterlySchedule,
    includeAdmission: effectiveIncludeAdmission,
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
      { $match: { sessionId: sessionOid, ...regularPaymentMatch } },
      { $group: { _id: "$studentId", paidAmount: { $sum: "$currentPayment" } } },
    ]),
  ]);

  return {
    structuresByClass: new Map(structures.map((s) => [s.classId.toString(), s as StructureLike])),
    paidByStudent: new Map(paidAgg.map((p) => [p._id.toString(), p.paidAmount])),
  };
};

export const getFeeStatusFromCache = (
  cache: SessionFeeCache,
  classId: string,
  studentId: string,
  studentFeeDiscount = 0,
  transport: TransportInfo = null
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

  const { grossTotal, totalDiscount, netTotal } = computeNetFee(
    structure,
    studentFeeDiscount,
    false,
    transport
  );
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

/** Fee status for every session except the one currently being collected. */
export const getStudentSessionArrears = async (
  studentId: string,
  classId: string,
  _enrolledSessionId: string,
  studentFeeDiscount = 0,
  transport: TransportInfo = null,
  excludeSessionId?: string
): Promise<SessionArrear[]> => {
  const studentOid = new Types.ObjectId(studentId);
  const classOid = new Types.ObjectId(classId);
  const [sessions, structures, payments] = await Promise.all([
    AcademicSession.find({ isActive: true }).sort({ startDate: -1 }).lean(),
    FeeStructure.find({ classId: classOid })
      .select("sessionId admissionFee monthlyFee annualFee computerFee examFee otherFee discount")
      .lean(),
    FeePayment.find({ studentId: studentOid, ...regularPaymentMatch })
      .select("sessionId currentPayment totalFee feeBreakdown.includeAdmission feeBreakdown.admissionFee")
      .lean(),
  ]);

  const structuresBySession = new Map(
    structures.map((structure) => [structure.sessionId.toString(), structure as StructureLike])
  );
  const paymentsBySession = new Map<string, typeof payments>();
  for (const payment of payments) {
    const sid = payment.sessionId.toString();
    const sessionPayments = paymentsBySession.get(sid) || [];
    sessionPayments.push(payment);
    paymentsBySession.set(sid, sessionPayments);
  }

  const arrears: SessionArrear[] = [];
  for (const session of sessions) {
    const sid = session._id.toString();
    if (excludeSessionId && sid === excludeSessionId) continue;

    const sessionPayments = paymentsBySession.get(sid) || [];
    const includeAdmission = sessionPayments.some((p) => {
      const b = p.feeBreakdown as { includeAdmission?: boolean; admissionFee?: number } | undefined;
      return Boolean(b?.includeAdmission || (b?.admissionFee ?? 0) > 0);
    });
    const structure = structuresBySession.get(sid);
    const paidAmount = sessionPayments.reduce((sum, payment) => sum + (payment.currentPayment || 0), 0);

    let totalFee = 0;
    let pendingAmount = 0;
    const hasFeeStructure = Boolean(structure);
    if (structure) {
      totalFee = computeNetFee(
        structure,
        studentFeeDiscount,
        includeAdmission,
        transport
      ).netTotal;
      pendingAmount = Math.max(0, totalFee - paidAmount);
    } else if (sessionPayments.length > 0) {
      totalFee = Math.max(paidAmount, ...sessionPayments.map((p) => p.totalFee || 0));
      pendingAmount = Math.max(0, totalFee - paidAmount);
    }

    arrears.push({
      sessionId: sid,
      sessionName: session.name,
      isCurrent: Boolean(session.isCurrent),
      startDate: session.startDate,
      totalFee,
      paidAmount,
      pendingAmount,
      hasFeeStructure,
    });
  }

  return arrears;
};

export const getStudentSessionFeeStatus = async (
  studentId: string,
  sessionId: string,
  classId: string,
  studentFeeDiscount = 0,
  includeAdmission = false,
  transport: TransportInfo = null
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
        ...regularPaymentMatch,
      },
    },
    { $group: { _id: null, paidAmount: { $sum: "$currentPayment" } } },
  ]);

  const structure = feeStructure as StructureLike;
  const { grossTotal, totalDiscount, netTotal } = computeNetFee(
    structure,
    studentFeeDiscount,
    includeAdmission,
    transport
  );
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

export type { QuarterScheduleItem, QuarterNumber };

export type QuarterlyReportStudent = {
  _id: string;
  studentName: string;
  registrationNumber: string;
  admissionNumber?: string;
  className: string;
  sectionName: string;
  quarters: {
    quarter: QuarterNumber;
    label: string;
    totalDue: number;
    paid: number;
    pending: number;
    status: "paid" | "partial" | "pending";
  }[];
  totalDue: number;
  totalPaid: number;
  totalPending: number;
  paymentStatus: "paid" | "partial" | "pending";
};

export type SessionQuarterlyCache = {
  structuresByClass: Map<string, StructureLike>;
  paymentsByStudent: Map<string, { quarter?: number | null; currentPayment: number }[]>;
  includeAdmissionByStudent: Map<string, boolean>;
  transportByStudent: Map<string, TransportInfo>;
};

export const createSessionQuarterlyCache = async (
  sessionId: string,
  students: {
    _id: { toString: () => string } | Types.ObjectId | string;
    transportRequired?: boolean;
    transportRouteId?: Types.ObjectId | string | null;
  }[] = []
): Promise<SessionQuarterlyCache> => {
  const sessionOid = new Types.ObjectId(sessionId);
  const [structures, payments] = await Promise.all([
    FeeStructure.find({ sessionId: sessionOid })
      .select("classId admissionFee monthlyFee annualFee computerFee examFee otherFee discount")
      .lean(),
    FeePayment.find({ sessionId: sessionOid, ...regularPaymentMatch })
      .select("studentId quarter currentPayment feeBreakdown.includeAdmission feeBreakdown.admissionFee")
      .lean(),
  ]);

  const structuresByClass = new Map(structures.map((s) => [s.classId.toString(), s as StructureLike]));
  const paymentsByStudent = new Map<string, { quarter?: number | null; currentPayment: number }[]>();
  const includeAdmissionByStudent = new Map<string, boolean>();

  for (const p of payments) {
    const sid = p.studentId.toString();
    if (!paymentsByStudent.has(sid)) paymentsByStudent.set(sid, []);
    paymentsByStudent.get(sid)!.push({
      quarter: p.quarter,
      currentPayment: p.currentPayment,
    });
    const breakdown = p.feeBreakdown as { includeAdmission?: boolean; admissionFee?: number } | undefined;
    if (breakdown?.includeAdmission || (breakdown?.admissionFee ?? 0) > 0) {
      includeAdmissionByStudent.set(sid, true);
    }
  }

  const transportByStudent = await buildStudentTransportMap(
    students.map((s) => ({
      _id: typeof s._id === "object" && "toString" in s._id ? s._id.toString() : String(s._id),
      transportRequired: s.transportRequired,
      transportRouteId: s.transportRouteId,
    }))
  );

  return { structuresByClass, paymentsByStudent, includeAdmissionByStudent, transportByStudent };
};

export const buildStudentQuarterlyReport = async (
  cache: SessionQuarterlyCache,
  classId: string,
  studentId: string,
  studentFeeDiscount = 0
): Promise<Omit<QuarterlyReportStudent, "_id" | "studentName" | "registrationNumber" | "admissionNumber" | "className" | "sectionName"> | null> => {
  const structure = cache.structuresByClass.get(classId);
  if (!structure) return null;

  const includeAdmission = cache.includeAdmissionByStudent.get(studentId) || false;
  const transport = cache.transportByStudent.get(studentId) || null;
  const payments = cache.paymentsByStudent.get(studentId) || [];
  const { totalDiscount } = computeNetFee(structure, studentFeeDiscount, includeAdmission, transport);
  const feePolicy = await getFeePolicy();
  const schedule = finalizeQuarterSchedule(
    structure,
    includeAdmission,
    payments,
    totalDiscount,
    feePolicy,
    transport
  );

  const quarters = schedule.map((q) => ({
    quarter: q.quarter,
    label: q.label,
    totalDue: q.totalDue,
    paid: q.paid,
    pending: q.pending,
    status: q.status,
  }));

  const totalDue = schedule.reduce((s, q) => s + q.totalDue, 0);
  const totalPaid = schedule.reduce((s, q) => s + q.paid, 0);
  const totalPending = schedule.reduce((s, q) => s + q.pending, 0);

  let paymentStatus: "paid" | "partial" | "pending" = "pending";
  if (totalPaid >= totalDue && totalDue > 0) paymentStatus = "paid";
  else if (totalPaid > 0) paymentStatus = "partial";

  return { quarters, totalDue, totalPaid, totalPending, paymentStatus };
};

export const aggregateQuarterlyTotals = (
  students: Pick<QuarterlyReportStudent, "quarters">[]
): Record<QuarterNumber, { due: number; collected: number; pending: number; countPaid: number; countPending: number }> => {
  const totals = {
    1: { due: 0, collected: 0, pending: 0, countPaid: 0, countPending: 0 },
    2: { due: 0, collected: 0, pending: 0, countPaid: 0, countPending: 0 },
    3: { due: 0, collected: 0, pending: 0, countPaid: 0, countPending: 0 },
    4: { due: 0, collected: 0, pending: 0, countPaid: 0, countPending: 0 },
  } as Record<QuarterNumber, { due: number; collected: number; pending: number; countPaid: number; countPending: number }>;

  for (const student of students) {
    for (const q of student.quarters) {
      const t = totals[q.quarter];
      t.due += q.totalDue;
      t.collected += q.paid;
      t.pending += q.pending;
      if (q.status === "paid") t.countPaid += 1;
      else if (q.pending > 0) t.countPending += 1;
    }
  }

  return totals;
};
