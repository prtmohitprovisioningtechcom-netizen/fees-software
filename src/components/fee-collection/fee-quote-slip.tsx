"use client";

import { formatCurrency } from "@/lib/utils";
import type { FeeCalculation, SchoolBranding } from "@/types";
import { getReceiptSchoolName } from "@/lib/school-branding";

type QuarterRow = NonNullable<FeeCalculation["quarterlySchedule"]>[number];

interface FeeQuoteSlipProps {
  student: Record<string, unknown>;
  sessionName?: string;
  calculation: FeeCalculation;
  schedule: QuarterRow[];
  studentDiscount: number;
  includeAdmission: boolean;
  branding: SchoolBranding;
  selectedQuarter?: number | null;
}

export function FeeQuoteSlip({
  student,
  sessionName,
  calculation,
  schedule,
  studentDiscount,
  includeAdmission,
  branding,
  selectedQuarter,
}: FeeQuoteSlipProps) {
  const schoolName = getReceiptSchoolName(branding);
  const cls = student.classId as { name?: string } | undefined;
  const sec = student.sectionId as { name?: string } | undefined;
  const structureDiscount = calculation.feeBreakdown.structureDiscount || 0;
  const totalDiscount = Math.min(
    calculation.grossTotal,
    structureDiscount + Math.max(0, studentDiscount)
  );
  const netTotal = Math.max(0, calculation.grossTotal - totalDiscount);
  const paidBefore = Math.max(0, calculation.paidAmount - (calculation.currentPayment || 0));
  const pending = Math.max(0, netTotal - paidBefore);

  const breakdownRows: { label: string; amount: number }[] = [
    { label: "Monthly Tuition (×12)", amount: calculation.feeBreakdown.monthlyFee || 0 },
    { label: "Quarterly Tuition (×3)", amount: calculation.feeBreakdown.quarterlyTuition || 0 },
  ];
  if (includeAdmission && (calculation.feeBreakdown.admissionFee || 0) > 0) {
    breakdownRows.push({ label: "Admission Pack (Q1)", amount: calculation.feeBreakdown.admissionFee });
  }
  breakdownRows.push(
    { label: "Exam Fee", amount: calculation.feeBreakdown.examFee || 0 },
    { label: "ID Card / Diary / Syllabus", amount: calculation.feeBreakdown.computerFee || 0 },
    { label: "Annual / Development", amount: calculation.feeBreakdown.annualFee || 0 },
    { label: "Tour / Other", amount: calculation.feeBreakdown.otherFee || 0 }
  );
  if ((calculation.feeBreakdown.transportFee || 0) > 0) {
    breakdownRows.push({
      label: calculation.feeBreakdown.transportRouteName
        ? `Transport (11 months) — ${calculation.feeBreakdown.transportRouteName}`
        : "Transport (11 months)",
      amount: calculation.feeBreakdown.transportFee,
    });
  }

  return (
    <div className="fee-quote-slip mx-auto w-full max-w-[148mm] bg-white text-black p-4 text-[11px] leading-snug border border-neutral-300 print:border-0">
      <div className="text-center border-b border-dashed border-neutral-400 pb-2 mb-3">
        <p className="text-[10px] font-bold tracking-widest text-amber-700 uppercase">
          Fee Quote — Not a Receipt
        </p>
        <h1 className="text-base font-extrabold uppercase mt-1">{schoolName || "School Fee Quote"}</h1>
        {(branding.address || branding.phone || branding.email) && (
          <p className="mt-0.5 text-[9px] text-neutral-600">
            {[branding.address, branding.phone ? `Ph: ${branding.phone}` : "", branding.email]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        <p className="mt-1 text-[9px] text-neutral-500">
          Session: <strong>{sessionName || "—"}</strong>
          {selectedQuarter ? ` · Selected Q${selectedQuarter}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-3">
        <p><span className="text-neutral-500">Student:</span> <strong>{String(student.studentName || "")}</strong></p>
        <p><span className="text-neutral-500">Reg. No:</span> <strong>{String(student.registrationNumber || "")}</strong></p>
        <p><span className="text-neutral-500">Class:</span> <strong>{cls?.name || "—"}-{sec?.name || "—"}</strong></p>
        <p><span className="text-neutral-500">Father:</span> <strong>{String(student.fatherName || "")}</strong></p>
        <p><span className="text-neutral-500">Mobile:</span> <strong>{String(student.mobileNumber || "")}</strong></p>
        <p>
          <span className="text-neutral-500">Admission pack:</span>{" "}
          <strong>{includeAdmission ? "Included" : "Not included"}</strong>
        </p>
      </div>

      <table className="w-full mb-3 border-collapse">
        <thead>
          <tr className="border-b border-neutral-300 text-left">
            <th className="py-1 font-semibold">Annual Particular</th>
            <th className="py-1 font-semibold text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {breakdownRows
            .filter((row) => row.amount > 0 || row.label.includes("Tuition"))
            .map((row) => (
              <tr key={row.label} className="border-b border-neutral-100">
                <td className="py-1">{row.label}</td>
                <td className="py-1 text-right tabular-nums">{formatCurrency(row.amount)}</td>
              </tr>
            ))}
          <tr>
            <td className="py-1 font-semibold">Gross Total</td>
            <td className="py-1 text-right font-semibold tabular-nums">{formatCurrency(calculation.grossTotal)}</td>
          </tr>
          {totalDiscount > 0 && (
            <tr>
              <td className="py-1 text-emerald-700">Total Discount</td>
              <td className="py-1 text-right text-emerald-700 tabular-nums">− {formatCurrency(totalDiscount)}</td>
            </tr>
          )}
          <tr>
            <td className="py-1 font-bold">Net Total Fee</td>
            <td className="py-1 text-right font-bold tabular-nums">{formatCurrency(netTotal)}</td>
          </tr>
          <tr>
            <td className="py-1">Already Paid</td>
            <td className="py-1 text-right tabular-nums">{formatCurrency(paidBefore)}</td>
          </tr>
          <tr>
            <td className="py-1 font-bold text-amber-800">Pending / Due</td>
            <td className="py-1 text-right font-bold text-amber-800 tabular-nums">{formatCurrency(pending)}</td>
          </tr>
        </tbody>
      </table>

      <p className="font-semibold mb-1">Quarterly Schedule</p>
      <table className="w-full mb-3 border-collapse">
        <thead>
          <tr className="border-b border-neutral-300 text-left">
            <th className="py-1">Quarter</th>
            <th className="py-1 text-right">Due</th>
            <th className="py-1 text-right">Paid</th>
            <th className="py-1 text-right">Pending</th>
            <th className="py-1 text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((q) => (
            <tr key={q.quarter} className="border-b border-neutral-100">
              <td className="py-1">Q{q.quarter}{selectedQuarter === q.quarter ? " *" : ""}</td>
              <td className="py-1 text-right tabular-nums">{formatCurrency(q.totalDue)}</td>
              <td className="py-1 text-right tabular-nums">{formatCurrency(q.paid)}</td>
              <td className="py-1 text-right tabular-nums">{formatCurrency(q.pending)}</td>
              <td className="py-1 text-right capitalize">{q.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-[9px] text-center text-neutral-500 border-t border-dashed border-neutral-400 pt-2">
        This is a fee quotation only. No payment has been recorded. Use <strong>Save Payment</strong> to collect fee and generate an official receipt.
      </p>
    </div>
  );
}
