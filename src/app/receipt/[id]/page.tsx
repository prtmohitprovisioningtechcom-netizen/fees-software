"use client";

import { Suspense, useEffect, useState, useMemo, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/layout/back-button";
import { feePaymentsApi, settingsApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { parseSchoolBranding, getReceiptSchoolName } from "@/lib/school-branding";
import type { SchoolBranding } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { QUARTER_LABELS, type QuarterNumber } from "@/lib/fee-schedule";
import { displayStudentField, refName } from "@/lib/student-display";

type Breakdown = {
  admissionFee?: number;
  monthlyFee?: number;
  quarterlyTuition?: number;
  annualFee?: number;
  computerFee?: number;
  examFee?: number;
  transportFee?: number;
  transportRouteName?: string;
  otherFee?: number;
  annualCharges?: number;
  grossTotal?: number;
  structureDiscount?: number;
  studentDiscount?: number;
  totalDiscount?: number;
  includeAdmission?: boolean;
};

function getStructureRows(b: Breakdown) {
  const rows: { label: string; amount: number }[] = [];
  if (b.monthlyFee) {
    rows.push({ label: "Tuition (Annual ×12)", amount: b.monthlyFee });
  }
  if (b.admissionFee && b.admissionFee > 0) {
    rows.push({ label: "Admission Pack", amount: b.admissionFee });
  }
  if (b.examFee) rows.push({ label: "Exam Fee", amount: b.examFee });
  if (b.computerFee) rows.push({ label: "ID Card / Diary / Syllabus", amount: b.computerFee });
  if (b.annualFee) rows.push({ label: "Annual / Development", amount: b.annualFee });
  if (b.otherFee) rows.push({ label: "Form / Insurance (F.I.)", amount: b.otherFee });
  if (b.transportFee) {
    rows.push({
      label: b.transportRouteName ? `Transport — ${b.transportRouteName}` : "Transport (11 months)",
      amount: b.transportFee,
    });
  }
  return rows;
}

function buildData(payment: Record<string, unknown> | null) {
  if (!payment) return null;
  const student = payment.studentId as Record<string, unknown>;
  const cls = student.classId as { name: string };
  const sec = student.sectionId as { name: string };
  const session = payment.sessionId as { name: string } | null;
  const customSessionName = payment.customSessionName as string | undefined;
  const sessionDisplayName = customSessionName || session?.name || "—";
  const breakdown = (payment.feeBreakdown || {}) as Breakdown;
  const collectedBy = payment.collectedBy as { name: string };
  const quarter = payment.quarter as number | undefined;
  const currentPayment = payment.currentPayment as number;
  const paidAmount = payment.paidAmount as number;
  const paidBefore = paidAmount - currentPayment;

  return {
    student,
    cls,
    sec,
    session,
    sessionDisplayName,
    customSessionName,
    breakdown,
    collectedBy,
    quarter,
    quarterLabel: quarter ? QUARTER_LABELS[quarter as QuarterNumber] : null,
    structureRows: getStructureRows(breakdown),
    currentPayment,
    paidBefore,
    paidAmount,
    balance: payment.balance as number,
    totalFee: payment.totalFee as number,
    grossTotal: breakdown.grossTotal || (payment.totalFee as number) + (breakdown.totalDiscount || 0),
    totalDiscount: breakdown.totalDiscount || 0,
    structureDiscount: breakdown.structureDiscount || 0,
    studentDiscount: breakdown.studentDiscount || 0,
    paymentStatus: payment.paymentStatus as string,
    remarks: payment.remarks as string | undefined,
  };
}

type SlipData = NonNullable<ReturnType<typeof buildData>>;

function FeeSlip({
  data,
  payment,
  branding,
  userName,
}: {
  data: SlipData;
  payment: Record<string, unknown>;
  branding: SchoolBranding;
  userName?: string;
}) {
  const schoolName = getReceiptSchoolName(branding);
  const isPaid = data.paymentStatus === "paid";
  const recordStatus = String(payment.recordStatus || "active");
  const isInactiveRecord = recordStatus !== "active";
  const statusLabel = isInactiveRecord
    ? recordStatus.toUpperCase()
    : data.paymentStatus === "paid"
      ? "PAID"
      : data.paymentStatus === "partial"
        ? "PARTIAL"
        : "PENDING";

  return (
    <article className="fee-slip mx-auto bg-white text-black shadow-md print:shadow-none relative">
      {isInactiveRecord && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <p className="rotate-[-24deg] text-4xl font-black uppercase tracking-widest text-red-500/25 border-4 border-red-400/30 px-6 py-2">
            {recordStatus}
          </p>
        </div>
      )}
      {/* Top accent */}
      <div className="h-1.5 bg-[#1e3a8a] print:bg-black" />

      <div className="px-4 py-3 sm:px-5 sm:py-4">
        {/* Header — school identity */}
        <header className="flex items-start gap-3 border-b border-black/20 pb-2.5">
          {branding.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logo}
              alt=""
              className="h-12 w-12 shrink-0 rounded object-contain border border-black/10"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-[#1e3a8a] text-white text-lg font-bold">
              {(schoolName || "S").charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-[15px] sm:text-base font-extrabold uppercase leading-tight tracking-wide text-[#0f172a]">
              {schoolName || "School Fee Receipt"}
            </h1>
            {(branding.address || branding.phone || branding.email) && (
              <p className="mt-0.5 text-[9px] leading-snug text-neutral-600">
                {[branding.address, branding.phone ? `Ph: ${branding.phone}` : "", branding.email]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <p className="mt-1 text-[11px] font-bold tracking-[0.15em] text-[#1e3a8a] uppercase">
              Fee Payment Receipt
            </p>
            {isInactiveRecord && Boolean(payment.auditReason) && (
              <p className="mt-1 text-[9px] text-red-700">
                {recordStatus}: {String(payment.auditReason)}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <span
              className={`inline-block rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${
                isPaid
                  ? "border-emerald-600 text-emerald-700"
                  : "border-amber-600 text-amber-700"
              }`}
            >
              {statusLabel}
            </span>
          </div>
        </header>

        {/* Meta row */}
        <div className="mt-2 grid grid-cols-4 gap-x-2 gap-y-1 border-b border-dashed border-black/15 pb-2 text-[10px]">
          <div>
            <p className="text-neutral-500 uppercase tracking-wide text-[8px]">Receipt No.</p>
            <p className="font-bold font-mono text-[11px]">{payment.receiptNumber as string}</p>
          </div>
          <div>
            <p className="text-neutral-500 uppercase tracking-wide text-[8px]">Date</p>
            <p className="font-semibold">{formatDate(payment.paymentDate as string)}</p>
          </div>
          <div>
            <p className="text-neutral-500 uppercase tracking-wide text-[8px]">Session</p>
            <p className="font-semibold">{data.sessionDisplayName}</p>
          </div>
          <div>
            <p className="text-neutral-500 uppercase tracking-wide text-[8px]">For</p>
            <p className="font-semibold text-[#1e3a8a]">
              {data.customSessionName ? "Previous Dues" : data.quarterLabel?.replace("Quarter ", "Q") || "Custom"}
            </p>
          </div>
        </div>

        {/* Student + Payment amount side by side */}
        <div className="mt-2 grid grid-cols-[1.2fr_0.8fr] gap-2">
          <section className="rounded border border-black/15 overflow-hidden">
            <div className="bg-neutral-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-neutral-600 border-b border-black/10">
              Student
            </div>
            <div className="px-2 py-1.5 text-[10px] space-y-0.5">
              <div className="flex justify-between gap-2">
                <span className="text-neutral-500 shrink-0">Name</span>
                <strong className="text-right truncate">{displayStudentField(data.student.studentName)}</strong>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-neutral-500">Reg. No.</span>
                <span className="font-mono">{displayStudentField(data.student.registrationNumber)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-neutral-500">Adm. No.</span>
                <span>{displayStudentField(data.student.admissionNumber)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-neutral-500">PEN</span>
                <span>{displayStudentField(data.student.studentPen)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-neutral-500">Class</span>
                <span>
                  {refName(data.cls)}
                  {refName(data.sec, "") ? ` / ${refName(data.sec)}` : ""}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-neutral-500">Father</span>
                <span className="text-right truncate">{displayStudentField(data.student.fatherName)}</span>
              </div>
            </div>
          </section>

          <section className="rounded border-2 border-[#1e3a8a] bg-[#1e3a8a]/[0.04] flex flex-col justify-center px-2.5 py-2 text-center">
            <p className="text-[8px] font-bold uppercase tracking-wider text-[#1e3a8a]">Amount Received</p>
            <p className="mt-0.5 text-xl sm:text-2xl font-black tabular-nums text-[#1e3a8a] leading-none">
              {formatCurrency(data.currentPayment)}
            </p>
            <p className="mt-1 text-[9px] capitalize text-neutral-600">
              {(payment.paymentMode as string).replace("_", " ")}
              {data.quarterLabel ? ` · ${data.quarterLabel.replace("Quarter ", "Q")}` : ""}
            </p>
          </section>
        </div>

        {/* Fee structure + Summary — 2 columns */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <section className="rounded border border-black/15 overflow-hidden">
            <div className="bg-neutral-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-neutral-600 border-b border-black/10">
              Annual Fee Structure
            </div>
            <table className="w-full text-[9px]">
              <tbody>
                {data.structureRows.length === 0 ? (
                  <tr>
                    <td className="px-2 py-1 text-neutral-400">—</td>
                  </tr>
                ) : (
                  data.structureRows.map((row) => (
                    <tr key={row.label} className="border-b border-dashed border-black/10 last:border-0">
                      <td className="px-2 py-0.5 pr-1 text-neutral-700 leading-tight">{row.label}</td>
                      <td className="px-2 py-0.5 text-right tabular-nums font-medium whitespace-nowrap">
                        {formatCurrency(row.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <section className="rounded border border-black/15 overflow-hidden">
            <div className="bg-neutral-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-neutral-600 border-b border-black/10">
              Payment Summary
            </div>
            <div className="px-2 py-1 text-[9px] space-y-0.5">
              <div className="flex justify-between gap-1">
                <span className="text-neutral-500">Gross Total</span>
                <span className="tabular-nums">{formatCurrency(data.grossTotal as number)}</span>
              </div>
              {data.structureDiscount > 0 && (
                <div className="flex justify-between gap-1 text-emerald-700">
                  <span>Class Discount</span>
                  <span className="tabular-nums">− {formatCurrency(data.structureDiscount)}</span>
                </div>
              )}
              {data.studentDiscount > 0 && (
                <div className="flex justify-between gap-1 text-emerald-700">
                  <span>Student Discount</span>
                  <span className="tabular-nums">− {formatCurrency(data.studentDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between gap-1 font-semibold border-t border-dashed border-black/15 pt-0.5">
                <span>Net Annual Fee</span>
                <span className="tabular-nums">{formatCurrency(data.totalFee)}</span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="text-neutral-500">Paid Before</span>
                <span className="tabular-nums">{formatCurrency(data.paidBefore)}</span>
              </div>
              <div className="flex justify-between gap-1 font-bold text-[#1e3a8a] bg-[#1e3a8a]/[0.06] -mx-1 px-1 rounded">
                <span>This Payment</span>
                <span className="tabular-nums">{formatCurrency(data.currentPayment)}</span>
              </div>
              <div className="flex justify-between gap-1 font-semibold">
                <span>Total Paid</span>
                <span className="tabular-nums">{formatCurrency(data.paidAmount)}</span>
              </div>
              <div
                className={`flex justify-between gap-1 font-bold border-t border-black/15 pt-0.5 ${
                  data.balance === 0 ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                <span>Balance Due</span>
                <span className="tabular-nums">{formatCurrency(data.balance)}</span>
              </div>
            </div>
          </section>
        </div>

        {data.remarks ? (
          <p className="mt-1.5 text-[9px] text-neutral-600">
            <span className="font-semibold">Remarks:</span> {data.remarks}
          </p>
        ) : null}

        {/* Signatures */}
        <footer className="mt-3 grid grid-cols-2 gap-6 border-t border-dashed border-black/20 pt-2.5 text-[9px]">
          <div>
            <p className="text-neutral-500">Collected By</p>
            <p className="mt-3 font-semibold border-t border-black/40 pt-0.5 inline-block min-w-[120px]">
              {data.collectedBy?.name || userName || "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-neutral-500">Parent / Guardian</p>
            <p className="mt-3 font-semibold border-t border-black/40 pt-0.5 inline-block min-w-[120px] text-transparent select-none">
              .
            </p>
          </div>
        </footer>

        <p className="mt-2 text-center text-[8px] text-neutral-400">
          Computer-generated receipt · Please retain for records · {schoolName || "School Fee System"}
        </p>
      </div>
    </article>
  );
}

function ReceiptPageContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const idParam = params?.id ?? "";
  const paymentIds = useMemo(
    () =>
      idParam
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [idParam]
  );
  const shouldPrint = searchParams?.get("print") === "1";
  const printedRef = useRef(false);
  const { user } = useAuth();
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);
  const [branding, setBranding] = useState<SchoolBranding>({
    schoolName: "",
    appName: "",
    logo: "",
    address: "",
    phone: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (paymentIds.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all([
      Promise.all(paymentIds.map((paymentId) => feePaymentsApi.getById(paymentId))),
      settingsApi.get().catch(() => null),
    ])
      .then(([paymentResponses, settingsRes]) => {
        setPayments(
          paymentResponses.map((paymentRes) => (paymentRes as { data: Record<string, unknown> }).data)
        );
        const settings = (settingsRes as { data?: Partial<SchoolBranding> } | null)?.data;
        setBranding(parseSchoolBranding(settings));
      })
      .finally(() => setLoading(false));
  }, [paymentIds]);

  const slipEntries = useMemo(
    () =>
      payments
        .map((payment) => ({ payment, data: buildData(payment) }))
        .filter((entry): entry is { payment: Record<string, unknown>; data: SlipData } => Boolean(entry.data)),
    [payments]
  );

  useEffect(() => {
    if (shouldPrint && !loading && slipEntries.length > 0 && !printedRef.current) {
      printedRef.current = true;
      const timer = window.setTimeout(() => window.print(), 400);
      return () => window.clearTimeout(timer);
    }
  }, [shouldPrint, loading, slipEntries.length]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (slipEntries.length === 0) return;
    const entry = slipEntries[0];
    const payment = entry.payment;
    const data = entry.data;
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF({ format: "a5", unit: "mm" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 8;
    const schoolName = getReceiptSchoolName(branding);

    doc.setDrawColor(30, 58, 138);
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageW, 2.5, "F");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const nameLines = doc.splitTextToSize(schoolName || "Fee Receipt", pageW - 20);
    doc.text(nameLines, pageW / 2, y + 4, { align: "center" });
    y += 4 + nameLines.length * 5;

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const contact = [branding.address, branding.phone ? `Ph: ${branding.phone}` : "", branding.email]
      .filter(Boolean)
      .join(" · ");
    if (contact) {
      const cLines = doc.splitTextToSize(contact, pageW - 16);
      doc.text(cLines, pageW / 2, y, { align: "center" });
      y += cLines.length * 3.2 + 1;
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text("FEE PAYMENT RECEIPT", pageW / 2, y, { align: "center" });
    doc.setTextColor(0, 0, 0);
    y += 6;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Receipt: ${payment.receiptNumber}`, 8, y);
    doc.text(`Date: ${formatDate(payment.paymentDate as string)}`, pageW - 8, y, { align: "right" });
    y += 4;
    doc.text(`Session: ${data.sessionDisplayName}`, 8, y);
    doc.text(
      `For: ${data.customSessionName ? "Previous Dues" : data.quarterLabel || "Custom"}`,
      pageW - 8,
      y,
      { align: "right" }
    );
    y += 5;

    doc.setFont("helvetica", "bold");
    doc.text(`Student: ${displayStudentField(data.student.studentName)}`, 8, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.text(
      `Reg: ${displayStudentField(data.student.registrationNumber)}  |  Adm: ${displayStudentField(data.student.admissionNumber)}  |  PEN: ${displayStudentField(data.student.studentPen)}`,
      8,
      y
    );
    y += 4;
    doc.text(
      `Class: ${refName(data.cls)}-${refName(data.sec)}  |  Father: ${displayStudentField(data.student.fatherName)}`,
      8,
      y
    );
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text(`Amount Received: ${formatCurrency(data.currentPayment)}`, pageW / 2, y, { align: "center" });
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    y += 3;
    doc.text(`Mode: ${(payment.paymentMode as string).replace("_", " ")}`, pageW / 2, y, { align: "center" });
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [["Particular", "Amount"]],
      body: data.structureRows.map((r) => [r.label, formatCurrency(r.amount)]),
      styles: { fontSize: 7.5, cellPadding: 1.2 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 7 },
      columnStyles: { 1: { halign: "right", cellWidth: 28 } },
      margin: { left: 8, right: 8 },
      theme: "grid",
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;

    const summaryRows: string[][] = [
      ["Gross Total", formatCurrency(data.grossTotal as number)],
    ];
    if (data.structureDiscount > 0) summaryRows.push(["Class Discount", `- ${formatCurrency(data.structureDiscount)}`]);
    if (data.studentDiscount > 0) summaryRows.push(["Student Discount", `- ${formatCurrency(data.studentDiscount)}`]);
    summaryRows.push(
      ["Net Annual Fee", formatCurrency(data.totalFee)],
      ["Paid Before", formatCurrency(data.paidBefore)],
      ["THIS PAYMENT", formatCurrency(data.currentPayment)],
      ["Total Paid", formatCurrency(data.paidAmount)],
      ["Balance Due", formatCurrency(data.balance)],
      ["Status", data.paymentStatus.toUpperCase()]
    );

    autoTable(doc, {
      startY: y,
      head: [["Payment Summary", ""]],
      body: summaryRows,
      styles: { fontSize: 7.5, cellPadding: 1.2 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 7 },
      columnStyles: { 1: { halign: "right", cellWidth: 30 } },
      margin: { left: 8, right: 8 },
      theme: "grid",
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    doc.setFontSize(8);
    doc.text(`Collected By: ${data.collectedBy?.name || user?.name || "—"}`, 8, y);
    doc.text("Parent Signature: _______________", pageW - 8, y, { align: "right" });

    doc.save(`${payment.receiptNumber}.pdf`);
  };

  if (loading || slipEntries.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <div className="text-center space-y-3">
          <div className="mx-auto h-9 w-9 rounded-full border-4 border-[#1e3a8a] border-t-transparent animate-spin" />
          <p className="text-sm text-neutral-500">Loading receipt…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .fee-slip {
          width: 100%;
          max-width: 148mm;
        }
        @media print {
          @page {
            size: A5 portrait;
            margin: 6mm;
          }
          html, body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          .fee-slip {
            max-width: none !important;
            width: 100% !important;
            box-shadow: none !important;
          }
          .fee-slip + .fee-slip {
            break-before: page;
            page-break-before: always;
            margin-top: 0 !important;
          }
          .print-area {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            min-height: auto !important;
          }
        }
      `}</style>

      <div className="print-area min-h-screen bg-neutral-100 p-4 print:bg-white print:p-0">
        <div className="no-print mx-auto mb-4 flex max-w-[148mm] flex-wrap items-center gap-2">
          <BackButton />
          <Button size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print Slip
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
          <span className="ml-auto text-[11px] text-neutral-500">
            {slipEntries.length > 1
              ? `${slipEntries.length} family slips · A5 each`
              : "Single-page A5 fee slip"}
          </span>
        </div>

        {slipEntries.length > 1 && (
          <p className="no-print mx-auto mb-3 max-w-[148mm] text-xs text-neutral-600">
            Family payment — {slipEntries.length} separate receipts (main student + siblings). Print once to get all slips.
          </p>
        )}

        <div className="mx-auto max-w-[148mm] space-y-6 print:space-y-0">
          {slipEntries.map(({ payment, data }, index) => (
            <FeeSlip
              key={String(payment._id || index)}
              data={data}
              payment={payment}
              branding={branding}
              userName={user?.name}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function ReceiptLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100">
      <div className="text-center space-y-3">
        <div className="mx-auto h-9 w-9 rounded-full border-4 border-[#1e3a8a] border-t-transparent animate-spin" />
        <p className="text-sm text-neutral-500">Loading receipt…</p>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<ReceiptLoading />}>
      <ReceiptPageContent />
    </Suspense>
  );
}
