"use client";

import { formatCurrency } from "@/lib/utils";
import type { FeeCalculation, SchoolBranding } from "@/types";
import { getReceiptSchoolName } from "@/lib/school-branding";
import { QUARTER_LABELS, type QuarterNumber } from "@/lib/fee-schedule";
import { displayStudentField, refName } from "@/lib/student-display";

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
  schedule,
  includeAdmission,
  branding,
  selectedQuarter,
}: FeeQuoteSlipProps) {
  const schoolName = getReceiptSchoolName(branding);

  const quartersToShow =
    selectedQuarter != null
      ? schedule.filter((q) => q.quarter === selectedQuarter)
      : schedule;

  const focusQuarter = quartersToShow[0];
  const label =
    focusQuarter?.label ||
    (selectedQuarter
      ? QUARTER_LABELS[selectedQuarter as QuarterNumber] || `Quarter ${selectedQuarter}`
      : "All Quarters");

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
        </p>
        <p className="mt-0.5 text-[11px] font-bold text-[#1e3a8a]">
          {selectedQuarter ? label : "Select a quarter to print quote"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-3">
        <p><span className="text-neutral-500">Student:</span> <strong>{displayStudentField(student.studentName)}</strong></p>
        <p><span className="text-neutral-500">Reg. No:</span> <strong>{displayStudentField(student.registrationNumber)}</strong></p>
        <p><span className="text-neutral-500">Admission:</span> <strong>{displayStudentField(student.admissionNumber)}</strong></p>
        <p><span className="text-neutral-500">PEN:</span> <strong>{displayStudentField(student.studentPen)}</strong></p>
        <p><span className="text-neutral-500">Class:</span> <strong>{refName(student.classId)}-{refName(student.sectionId)}</strong></p>
        <p><span className="text-neutral-500">Father:</span> <strong>{displayStudentField(student.fatherName)}</strong></p>
        <p><span className="text-neutral-500">Mobile:</span> <strong>{displayStudentField(student.mobileNumber)}</strong></p>
        <p>
          <span className="text-neutral-500">Admission pack:</span>{" "}
          <strong>{includeAdmission ? "Included in Q1" : "Not included"}</strong>
        </p>
      </div>

      {!focusQuarter ? (
        <p className="text-center text-amber-800 py-6">
          Pehle Quarter 1 / 2 / 3 / 4 select karein, phir Print Fee Quote use karein.
        </p>
      ) : (
        <>
          <div className="mb-3 rounded border border-neutral-300 px-3 py-2">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="font-bold text-[12px]">{label}</p>
              <span className="text-[10px] tracking-wide font-bold capitalize">{focusQuarter.status}</span>
            </div>

            {(focusQuarter.componentsDue || []).filter((c) => c.amount > 0).length > 0 && (
              <div className="mb-2 space-y-0.5 text-[10px] text-neutral-600 border-b border-neutral-200 pb-2">
                {(focusQuarter.componentsDue || [])
                  .filter((c) => c.amount > 0)
                  .map((c) => (
                    <div key={c.key} className="flex justify-between gap-2">
                      <span>{c.label}</span>
                      <span className="tabular-nums">{formatCurrency(c.amount)}</span>
                    </div>
                  ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded bg-neutral-50 px-2 py-2">
                <p className="text-[9px] text-neutral-500 uppercase tracking-wide">Due</p>
                <p className="mt-0.5 text-[13px] font-bold tabular-nums">
                  {formatCurrency(focusQuarter.totalDue)}
                </p>
              </div>
              <div className="rounded bg-emerald-50 px-2 py-2">
                <p className="text-[9px] text-emerald-700 uppercase tracking-wide">Jama / Paid</p>
                <p className="mt-0.5 text-[13px] font-bold tabular-nums text-emerald-700">
                  {formatCurrency(focusQuarter.paid)}
                </p>
              </div>
              <div className="rounded bg-amber-50 px-2 py-2">
                <p className="text-[9px] text-amber-800 uppercase tracking-wide">Pending</p>
                <p className="mt-0.5 text-[13px] font-bold tabular-nums text-amber-800">
                  {formatCurrency(focusQuarter.pending)}
                </p>
              </div>
            </div>
          </div>

          <p className="text-[9px] text-center text-neutral-500 border-t border-dashed border-neutral-400 pt-2">
            Sirf selected quarter ka quote — payment save nahi hua. Official receipt ke liye{" "}
            <strong>Save Payment</strong> use karein.
          </p>
        </>
      )}
    </div>
  );
}
