/** Dynamic quarterly fee policy — super admin configures which component is charged in which quarter. */

import type { QuarterNumber } from "./fee-schedule";

export type { QuarterNumber };

export type AllocatableFeeKey =
  | "admissionFee"
  | "annualFee"
  | "computerFee"
  | "examFee"
  | "otherFee";

export interface FeeComponentDef {
  key: AllocatableFeeKey;
  label: string;
  enabled: boolean;
  newStudentOnly?: boolean;
}

export interface QuarterPercent {
  quarter: QuarterNumber;
  percent: number;
}

export interface FeePolicy {
  components: FeeComponentDef[];
  allocations: Record<AllocatableFeeKey, QuarterPercent[]>;
}

export const ALLOCATABLE_KEYS: AllocatableFeeKey[] = [
  "admissionFee",
  "annualFee",
  "computerFee",
  "examFee",
  "otherFee",
];

/** Matches school note: Q1 = 3mo + F.I + I.C. + Annual + Admission; Q2/Q3 = 3mo + ½ exam; Q4 = 3mo */
export const DEFAULT_FEE_POLICY: FeePolicy = {
  components: [
    { key: "admissionFee", label: "Admission Pack", enabled: true, newStudentOnly: true },
    { key: "computerFee", label: "ID Card / Diary (I.C.)", enabled: true },
    { key: "annualFee", label: "Annual / Development", enabled: true },
    { key: "otherFee", label: "Form / Insurance (F.I.)", enabled: true },
    { key: "examFee", label: "Exam Fee", enabled: true },
  ],
  allocations: {
    admissionFee: [{ quarter: 1, percent: 100 }],
    computerFee: [{ quarter: 1, percent: 100 }],
    annualFee: [{ quarter: 1, percent: 100 }],
    otherFee: [{ quarter: 1, percent: 100 }],
    examFee: [
      { quarter: 2, percent: 50 },
      { quarter: 3, percent: 50 },
    ],
  },
};

export function mergeFeePolicy(stored?: Partial<FeePolicy> | null): FeePolicy {
  if (!stored?.components?.length) return DEFAULT_FEE_POLICY;

  const components = DEFAULT_FEE_POLICY.components.map((def) => {
    const saved = stored.components?.find((c) => c.key === def.key);
    return saved ? { ...def, ...saved, key: def.key } : def;
  });

  const allocations = { ...DEFAULT_FEE_POLICY.allocations };
  for (const key of ALLOCATABLE_KEYS) {
    if (stored.allocations?.[key]?.length) {
      allocations[key] = stored.allocations[key].map((a) => ({
        quarter: a.quarter as QuarterNumber,
        percent: Math.max(0, Math.min(100, Number(a.percent) || 0)),
      }));
    }
  }

  return { components, allocations };
}

export function getComponentLabel(policy: FeePolicy, key: AllocatableFeeKey): string {
  return policy.components.find((c) => c.key === key)?.label || key;
}

export function isComponentEnabled(policy: FeePolicy, key: AllocatableFeeKey): boolean {
  return policy.components.find((c) => c.key === key)?.enabled !== false;
}

export function getPercentForQuarter(
  policy: FeePolicy,
  key: AllocatableFeeKey,
  quarter: QuarterNumber
): number {
  if (!isComponentEnabled(policy, key)) return 0;
  const match = policy.allocations[key]?.find((a) => a.quarter === quarter);
  return match?.percent ?? 0;
}

export function getComponentDueInQuarter(
  policy: FeePolicy,
  key: AllocatableFeeKey,
  annualAmount: number,
  quarter: QuarterNumber,
  includeAdmission: boolean
): number {
  if (annualAmount <= 0) return 0;
  const def = policy.components.find((c) => c.key === key);
  if (!def?.enabled) return 0;
  if (def.newStudentOnly && !includeAdmission) return 0;
  const percent = getPercentForQuarter(policy, key, quarter);
  if (percent <= 0) return 0;
  return Math.round((annualAmount * percent) / 100);
}

export function validateFeePolicy(policy: FeePolicy): string | null {
  for (const key of ALLOCATABLE_KEYS) {
    if (!isComponentEnabled(policy, key)) continue;
    const total = (policy.allocations[key] || []).reduce((s, a) => s + a.percent, 0);
    if (total > 0 && total !== 100) {
      const label = getComponentLabel(policy, key);
      return `${label} must total 100% across quarters (currently ${total}%)`;
    }
  }
  return null;
}

export interface QuarterComponentLine {
  key: string;
  label: string;
  amount: number;
}

export function buildQuarterComponentLines(
  amounts: Record<AllocatableFeeKey, number>,
  quarter: QuarterNumber,
  policy: FeePolicy,
  includeAdmission: boolean,
  quarterlyTuition: number
): QuarterComponentLine[] {
  const lines: QuarterComponentLine[] = [
    { key: "tuition", label: "Tuition (3 months)", amount: quarterlyTuition },
  ];

  for (const key of ALLOCATABLE_KEYS) {
    const due = getComponentDueInQuarter(policy, key, amounts[key] || 0, quarter, includeAdmission);
    if (due > 0) {
      lines.push({ key, label: getComponentLabel(policy, key), amount: due });
    }
  }

  return lines;
}

export function previewQuarterTotals(
  amounts: Record<AllocatableFeeKey, number> & { monthlyFee: number },
  policy: FeePolicy,
  includeAdmission: boolean
): { quarter: QuarterNumber; total: number; lines: QuarterComponentLine[] }[] {
  const quarterlyTuition = amounts.monthlyFee * 3;
  return ([1, 2, 3, 4] as QuarterNumber[]).map((quarter) => {
    const lines = buildQuarterComponentLines(
      amounts,
      quarter,
      policy,
      includeAdmission,
      quarterlyTuition
    );
    return {
      quarter,
      total: lines.reduce((s, l) => s + l.amount, 0),
      lines,
    };
  });
}
