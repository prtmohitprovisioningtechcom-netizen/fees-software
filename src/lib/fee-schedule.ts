/** Quarterly fee schedule — tuition × 3 per quarter; other charges per dynamic fee policy. */

import {
  DEFAULT_FEE_POLICY,
  buildQuarterComponentLines,
  type FeePolicy,
} from "./fee-policy";

export type FeeStructureAmounts = {
  admissionFee: number;
  monthlyFee: number;
  annualFee: number;
  computerFee: number;
  examFee: number;
  otherFee: number;
  transportFee?: number;
  discount?: number;
};

export type QuarterNumber = 1 | 2 | 3 | 4;

/** Transport: 11 months/year — Q1 = 2 months, Q2–Q4 = 3 months each */
export const TRANSPORT_MONTHS_BY_QUARTER: Record<QuarterNumber, number> = {
  1: 2,
  2: 3,
  3: 3,
  4: 3,
};

export const TRANSPORT_YEARLY_MONTHS = 11;

export const getYearlyTransport = (monthlyTransport: number) =>
  monthlyTransport * TRANSPORT_YEARLY_MONTHS;

export const getTransportDueInQuarter = (monthlyTransport: number, quarter: QuarterNumber) =>
  monthlyTransport * TRANSPORT_MONTHS_BY_QUARTER[quarter];

export const getTransportLabelForQuarter = (quarter: QuarterNumber) => {
  const months = TRANSPORT_MONTHS_BY_QUARTER[quarter];
  return `Transport (${months} month${months > 1 ? "s" : ""})`;
};

export interface QuarterScheduleItem {
  quarter: QuarterNumber;
  label: string;
  tuitionDue: number;
  annualChargesDue: number;
  admissionDue: number;
  componentsDue: { key: string; label: string; amount: number }[];
  totalDue: number;
  paid: number;
  pending: number;
  status: "paid" | "partial" | "pending";
}

export const QUARTER_LABELS: Record<QuarterNumber, string> = {
  1: "Quarter 1 (Apr–Jun)",
  2: "Quarter 2 (Jul–Sep)",
  3: "Quarter 3 (Oct–Dec)",
  4: "Quarter 4 (Jan–Mar)",
};

export const getQuarterlyTuition = (monthlyFee: number) => monthlyFee * 3;

export const getYearlyTuition = (monthlyFee: number) => monthlyFee * 12;

/** Exam + stationery + annual + other — full yearly total (allocation per quarter uses fee policy) */
export const getAnnualChargesTotal = (structure: FeeStructureAmounts) =>
  structure.examFee + structure.computerFee + structure.annualFee + structure.otherFee;

/** Old student yearly gross (no admission pack) */
export const getOldStudentYearlyTotal = (structure: FeeStructureAmounts) =>
  getYearlyTuition(structure.monthlyFee) + getAnnualChargesTotal(structure);

/** New student yearly gross (includes prospectus + registration + admission) */
export const getNewStudentYearlyTotal = (structure: FeeStructureAmounts) =>
  getOldStudentYearlyTotal(structure) + structure.admissionFee;

export const getGrossYearlyTotal = (
  structure: FeeStructureAmounts,
  includeAdmission: boolean,
  transportRequired = false
) => {
  let total = includeAdmission ? getNewStudentYearlyTotal(structure) : getOldStudentYearlyTotal(structure);
  if (transportRequired && (structure.transportFee || 0) > 0) {
    total += getYearlyTransport(structure.transportFee || 0);
  }
  return total;
};

export const getNetYearlyTotal = (
  structure: FeeStructureAmounts,
  includeAdmission: boolean,
  studentFeeDiscount = 0,
  transportRequired = false
) => {
  const gross = getGrossYearlyTotal(structure, includeAdmission, transportRequired);
  const structureDiscount = structure.discount || 0;
  const totalDiscount = Math.min(gross, structureDiscount + (studentFeeDiscount || 0));
  return Math.max(0, gross - totalDiscount);
};

const recalcQuarterStatus = (q: QuarterScheduleItem): QuarterScheduleItem => {
  const pending = Math.max(0, q.totalDue - q.paid);
  let status: QuarterScheduleItem["status"] = "pending";
  if (q.totalDue > 0 && q.paid >= q.totalDue) status = "paid";
  else if (q.paid > 0) status = "partial";
  return { ...q, pending, status };
};

export const buildQuarterSchedule = (
  structure: FeeStructureAmounts,
  includeAdmission: boolean,
  paidByQuarter: Partial<Record<QuarterNumber, number>> = {},
  policy: FeePolicy = DEFAULT_FEE_POLICY,
  transportRequired = false
): QuarterScheduleItem[] => {
  const quarterlyTuition = getQuarterlyTuition(structure.monthlyFee);
  const monthlyTransport = structure.transportFee || 0;
  const amounts = {
    admissionFee: structure.admissionFee,
    annualFee: structure.annualFee || 0,
    computerFee: structure.computerFee,
    examFee: structure.examFee,
    otherFee: structure.otherFee,
  };

  return ([1, 2, 3, 4] as QuarterNumber[]).map((quarter) => {
    const componentsDue = buildQuarterComponentLines(
      amounts,
      quarter,
      policy,
      includeAdmission,
      quarterlyTuition
    );
    if (transportRequired && monthlyTransport > 0) {
      componentsDue.push({
        key: "transport",
        label: getTransportLabelForQuarter(quarter),
        amount: getTransportDueInQuarter(monthlyTransport, quarter),
      });
    }
    const tuitionDue = quarterlyTuition;
    const admissionDue = componentsDue.find((c) => c.key === "admissionFee")?.amount || 0;
    const annualChargesDue = componentsDue
      .filter((c) => c.key !== "tuition" && c.key !== "admissionFee")
      .reduce((s, c) => s + c.amount, 0);
    const totalDue = componentsDue.reduce((s, c) => s + c.amount, 0);
    const paid = paidByQuarter[quarter] || 0;

    return recalcQuarterStatus({
      quarter,
      label: QUARTER_LABELS[quarter],
      tuitionDue,
      annualChargesDue,
      admissionDue,
      componentsDue,
      totalDue,
      paid,
      pending: 0,
      status: "pending",
    });
  });
};

export const getPaidByQuarter = (
  payments: { quarter?: number | null; currentPayment: number }[]
): Partial<Record<QuarterNumber, number>> => {
  const map: Partial<Record<QuarterNumber, number>> = {};
  for (const p of payments) {
    if (p.quarter && p.quarter >= 1 && p.quarter <= 4) {
      const q = p.quarter as QuarterNumber;
      map[q] = (map[q] || 0) + p.currentPayment;
    }
  }
  return map;
};

/** Apply tagged + untagged payments to quarters (FIFO: Q1 → Q4) */
export const allocatePaymentsToSchedule = (
  schedule: QuarterScheduleItem[],
  payments: { quarter?: number | null; currentPayment: number }[]
): QuarterScheduleItem[] => {
  const paidByQuarter = getPaidByQuarter(payments);
  const unallocated = payments
    .filter((p) => !p.quarter || p.quarter < 1 || p.quarter > 4)
    .reduce((sum, p) => sum + p.currentPayment, 0);

  const result = schedule.map((q) => ({
    ...q,
    paid: paidByQuarter[q.quarter] || 0,
  }));

  let remaining = unallocated;
  for (const q of result) {
    const gap = Math.max(0, q.totalDue - q.paid);
    const apply = Math.min(remaining, gap);
    q.paid += apply;
    remaining -= apply;
  }

  return result.map(recalcQuarterStatus);
};

/** Spread yearly discount across quarters proportionally */
export const applyDiscountToSchedule = (
  schedule: QuarterScheduleItem[],
  totalDiscount: number
): QuarterScheduleItem[] => {
  if (totalDiscount <= 0) return schedule.map(recalcQuarterStatus);

  const grossSum = schedule.reduce((s, q) => s + q.totalDue, 0);
  if (grossSum <= 0) return schedule.map(recalcQuarterStatus);

  const netSum = Math.max(0, grossSum - totalDiscount);
  let assignedNet = 0;

  return schedule.map((q, i) => {
    let netDue: number;
    if (i === schedule.length - 1) {
      netDue = Math.max(0, netSum - assignedNet);
    } else {
      netDue = Math.round((q.totalDue / grossSum) * netSum);
      assignedNet += netDue;
    }
    return recalcQuarterStatus({ ...q, totalDue: netDue });
  });
};

/** Full pipeline: gross quarters → allocate payments → apply discount */
export const finalizeQuarterSchedule = (
  structure: FeeStructureAmounts,
  includeAdmission: boolean,
  payments: { quarter?: number | null; currentPayment: number }[],
  totalDiscount: number,
  policy: FeePolicy = DEFAULT_FEE_POLICY,
  transportRequired = false
): QuarterScheduleItem[] => {
  const gross = buildQuarterSchedule(structure, includeAdmission, {}, policy, transportRequired);
  const withPayments = allocatePaymentsToSchedule(gross, payments);
  return applyDiscountToSchedule(withPayments, totalDiscount);
};

export const previewQuarterSchedule = (
  structure: FeeStructureAmounts,
  policy: FeePolicy,
  includeAdmission: boolean,
  transportRequired = false
) => buildQuarterSchedule(structure, includeAdmission, {}, policy, transportRequired);

export const getNextDueQuarter = (schedule: QuarterScheduleItem[]): QuarterScheduleItem | null =>
  schedule.find((q) => q.status !== "paid") || null;

export const sumSchedulePending = (schedule: QuarterScheduleItem[]) =>
  schedule.reduce((s, q) => s + q.pending, 0);
