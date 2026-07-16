import {
  allocatePaymentsToSchedule,
  finalizeQuarterSchedule,
  sumSchedulePending,
  getGrossYearlyTotal,
  getNetYearlyTotal,
  getQuarterlyTuition,
  getYearlyTransport,
  TRANSPORT_MONTHS_BY_QUARTER,
} from "../src/lib/fee-schedule";
import { compareSchoolClassNames } from "../src/server/constants/classes";

const structure = {
  admissionFee: 3000,
  monthlyFee: 1000,
  annualFee: 2000,
  computerFee: 500,
  examFee: 1000,
  otherFee: 300,
  discount: 1000,
};
const transport = { monthlyFee: 600, routeName: "Rampur" };

const checks: string[] = [];
const assert = (ok: boolean, msg: string) => {
  if (!ok) throw new Error("FAIL: " + msg);
  checks.push("OK: " + msg);
};

assert(getQuarterlyTuition(1000) === 3000, "quarterly tuition = monthly x 3");
assert(getYearlyTransport(600) === 6600, "transport yearly = 11 months");
assert(TRANSPORT_MONTHS_BY_QUARTER[1] === 2, "Q1 transport months = 2");
assert(TRANSPORT_MONTHS_BY_QUARTER[2] === 3, "Q2 transport months = 3");

const grossOld = getGrossYearlyTotal(structure, false, transport);
const grossNew = getGrossYearlyTotal(structure, true, transport);
assert(grossOld === 22400, `old student gross = 22400 got ${grossOld}`);
assert(grossNew === 25400, `new student gross = 25400 got ${grossNew}`);
assert(getNetYearlyTotal(structure, false, 500, transport) === 20900, "old student net = 20900");

const scheduleDiscount = finalizeQuarterSchedule(
  structure,
  false,
  [{ currentPayment: 300 }],
  200,
  undefined,
  null
);
const dueSum = scheduleDiscount.reduce((s, q) => s + q.totalDue, 0);
const expectedSimpleNet = getGrossYearlyTotal(structure, false, null) - 200;
assert(dueSum === expectedSimpleNet, `discounted due sum = ${expectedSimpleNet} got ${dueSum}`);
assert(scheduleDiscount.reduce((s, q) => s + q.paid, 0) === 300, "paid sum = 300");
assert(sumSchedulePending(scheduleDiscount) === dueSum - 300, "pending = due - paid");

const transportSched = finalizeQuarterSchedule(structure, true, [], 1500, undefined, transport);
const q1 = transportSched.find((q) => q.quarter === 1)!;
const q2 = transportSched.find((q) => q.quarter === 2)!;
assert(q1.totalDue > q2.totalDue, "Q1 due > Q2 when admission+annual in Q1");
assert(
  q1.admissionDue > 0 || (q1.componentsDue || []).some((c) => c.key === "admissionFee"),
  "admission in Q1"
);

const payQ1Full = finalizeQuarterSchedule(
  structure,
  true,
  [{ quarter: 1, currentPayment: q1.totalDue }],
  1500,
  undefined,
  transport
);
const paidQ1 = payQ1Full.find((q) => q.quarter === 1)!;
assert(paidQ1.status === "paid", "Q1 fully paid status");
assert(paidQ1.pending === 0, "Q1 pending 0");

const payPartial = finalizeQuarterSchedule(
  structure,
  false,
  [{ quarter: 2, currentPayment: 500 }],
  0,
  undefined,
  null
);
const p2 = payPartial.find((q) => q.quarter === 2)!;
assert(p2.status === "partial", "partial status");
assert(p2.paid === 500, "partial paid amount");

const full = finalizeQuarterSchedule(structure, false, [], 1500, undefined, transport);
const sumDue = full.reduce((s, q) => s + q.totalDue, 0);
assert(
  sumDue === getNetYearlyTotal(structure, false, 500, transport),
  `schedule due sum matches net yearly: ${sumDue}`
);

const names = ["X", "I", "Nursery/KG0/PP3", "Play Gourp", "II", "LKG/KG1/PP2", "UKG/KG2/PP1"];
const sorted = [...names].sort(compareSchoolClassNames);
assert(sorted[0].includes("Play"), "Play first");
assert(sorted[1].includes("Nursery"), "Nursery second");
assert(sorted[sorted.length - 1] === "X", "X last among sample");

// Refunded payment should not affect schedule when filtered out at service layer —
// verify tagged payment only affects its quarter
const tagged = finalizeQuarterSchedule(
  structure,
  false,
  [
    { quarter: 1, currentPayment: 1000 },
    { quarter: 3, currentPayment: 200 },
  ],
  0,
  undefined,
  null
);
assert(tagged.find((q) => q.quarter === 1)!.paid === 1000, "Q1 tagged payment");
assert(tagged.find((q) => q.quarter === 3)!.paid === 200, "Q3 tagged payment");
assert(tagged.find((q) => q.quarter === 2)!.paid === 0, "Q2 untouched");

// Overpay tagged quarter spills excess to next pending quarter
const overpay = finalizeQuarterSchedule(
  { admissionFee: 0, monthlyFee: 1000, annualFee: 0, computerFee: 0, examFee: 0, otherFee: 0, discount: 0 },
  false,
  [
    { quarter: 1, currentPayment: 3000 },
    { quarter: 1, currentPayment: 500 },
  ],
  0,
  undefined,
  null
);
assert(overpay.find((q) => q.quarter === 1)!.paid === 3000, "Q1 capped at due after overpay");
assert(overpay.find((q) => q.quarter === 1)!.status === "paid", "Q1 paid after overpay");
assert(overpay.find((q) => q.quarter === 2)!.paid === 500, "extra 500 spilled to Q2");
assert(overpay.find((q) => q.quarter === 2)!.pending === 2500, "Q2 pending after spill");

// User case: quarter due 4450 → pay 4000 then 500 → extra 50 to next quarter
const baseQ = (quarter: 1 | 2 | 3 | 4, totalDue: number) => ({
  quarter,
  label: `Q${quarter}`,
  tuitionDue: totalDue,
  annualChargesDue: 0,
  admissionDue: 0,
  componentsDue: [] as { key: string; label: string; amount: number }[],
  totalDue,
  paid: 0,
  pending: totalDue,
  status: "pending" as const,
});
const userSpill = allocatePaymentsToSchedule(
  [baseQ(1, 4450), baseQ(2, 4450), baseQ(3, 4450), baseQ(4, 4450)],
  [
    { quarter: 1, currentPayment: 4000 },
    { quarter: 1, currentPayment: 500 },
  ]
);
assert(userSpill.find((q) => q.quarter === 1)!.paid === 4450, "user-case Q1 paid 4450");
assert(userSpill.find((q) => q.quarter === 1)!.pending === 0, "user-case Q1 pending 0");
assert(userSpill.find((q) => q.quarter === 2)!.paid === 50, "user-case extra ₹50 on Q2");
assert(userSpill.find((q) => q.quarter === 2)!.pending === 4400, "user-case Q2 pending 4400");

console.log(checks.join("\n"));
console.log("\nALL CALCULATION CHECKS PASSED");
console.log(
  "Sample Q1/Q2/Q3/Q4 dues:",
  full.map((q) => `Q${q.quarter}:${q.totalDue}`).join(" | ")
);
