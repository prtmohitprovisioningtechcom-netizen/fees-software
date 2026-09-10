const fs = require('fs');
const path = require('path');

const content = `"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { feePaymentsApi, settingsApi } from "@/lib/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { parseSchoolBranding, getReceiptSchoolName } from "@/lib/school-branding";
import { SchoolHeader } from "@/components/shared/school-header";
import type { SchoolBranding } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { QUARTER_LABELS, type QuarterNumber } from "@/lib/fee-schedule";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const rows: { label: string; amount: number; note?: string }[] = [];
  if (b.monthlyFee) {
    const monthlyRate = Math.round(b.monthlyFee / 12);
    const quarterly = b.quarterlyTuition || monthlyRate * 3;
    rows.push({
      label: "Tuition Fee (Annual)",
      amount: b.monthlyFee,
      note: \`\${formatCurrency(monthlyRate)}/month · \${formatCurrency(quarterly)} per quarter\`,
    });
  }
  if (b.admissionFee && b.admissionFee > 0) {
    rows.push({ label: "Admission Pack", amount: b.admissionFee, note: "Prospectus + Registration + Admission" });
  }
  if (b.examFee) rows.push({ label: "Exam Fee", amount: b.examFee });
  if (b.computerFee) rows.push({ label: "ID Card / Diary / Syllabus", amount: b.computerFee });
  if (b.annualFee) rows.push({ label: "Annual / Development", amount: b.annualFee });
  if (b.otherFee) rows.push({ label: "Form / Insurance (F.I.)", amount: b.otherFee });
  if (b.transportFee) {
    rows.push({
      label: b.transportRouteName ? \`Transport — \${b.transportRouteName} (Annual)\` : "Transport (Annual)",
      amount: b.transportFee,
      note: "11 months — Q1: 2mo, Q2–Q4: 3mo each",
    });
  }
  return rows;
}

// ── Single receipt body rendered as a card ──────────────────────────────────
function ReceiptBody({
  data,
  payment,
  branding,
  userName,
  copyLabel,
}: {
  data: ReturnType<typeof buildData>;
  payment: Record<string, unknown>;
  branding: SchoolBranding;
  userName?: string;
  copyLabel: string;
}) {
  if (!data) return null;
  const statusLabel =
    data.paymentStatus === "paid" ? "FULLY PAID" : data.paymentStatus === "partial" ? "PARTIAL" : "PENDING";
  const isPaid = data.paymentStatus === "paid";

  return (
    <div className="receipt-card relative bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden print:rounded-none print:shadow-none print:border-gray-300">
      {/* Colored top bar */}
      <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-emerald-500" />

      {/* PAID Watermark */}
      {isPaid && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.05] select-none"
          aria-hidden
        >
          <span className="text-[120px] font-black text-emerald-600 rotate-[-30deg] tracking-widest">PAID</span>
        </div>
      )}

      <div className="px-6 py-5 space-y-5">
        {/* School Header */}
        <SchoolHeader branding={branding} subtitle="Fee Payment Receipt" variant="receipt" showLogo={Boolean(branding.logo)} />

        {/* Copy label + Status stamp */}
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground border border-muted rounded px-2 py-0.5">
            {copyLabel}
          </span>
          <span
            className={cn(
              "text-[10px] uppercase tracking-widest font-bold border rounded px-2 py-0.5",
              isPaid
                ? "border-emerald-400 text-emerald-700 bg-emerald-50"
                : data.paymentStatus === "partial"
                  ? "border-amber-400 text-amber-700 bg-amber-50"
                  : "border-gray-300 text-gray-600"
            )}
          >
            {statusLabel}
          </span>
        </div>

        {/* Receipt meta */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm bg-muted/40 rounded-lg p-3">
          <div>
            <span className="text-gray-500 text-[10px] uppercase tracking-wide">Receipt No.</span>
            <p className="font-bold font-mono text-base">{payment.receiptNumber as string}</p>
          </div>
          <div className="text-right">
            <span className="text-gray-500 text-[10px] uppercase tracking-wide">Date</span>
            <p className="font-semibold">{formatDate(payment.paymentDate as string)}</p>
          </div>
          {data.session?.name && (
            <div>
              <span className="text-gray-500 text-[10px] uppercase tracking-wide">Session</span>
              <p className="font-semibold">{data.session.name}</p>
            </div>
          )}
          {data.quarterLabel && (
            <div className="text-right">
              <span className="text-gray-500 text-[10px] uppercase tracking-wide">Payment For</span>
              <p className="font-semibold text-primary">{data.quarterLabel}</p>
            </div>
          )}
        </div>

        {/* Student info */}
        <div className="rounded-lg border border-gray-200 overflow-hidden text-sm">
          <div className="bg-gray-50 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold text-gray-500 border-b border-gray-200">
            Student Details
          </div>
          <div className="px-3 py-2 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <strong>{data.student.studentName as string}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Reg. No.</span>
              <span className="font-mono">{data.student.registrationNumber as string}</span>
            </div>
            {(data.student.admissionNumber as string) && (
              <div className="flex justify-between">
                <span className="text-gray-500">Admission No.</span>
                <span>{data.student.admissionNumber as string}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Class</span>
              <span>{data.cls?.name} — {data.sec?.name}</span>
            </div>
            {(data.student.fatherName as string) && (
              <div className="flex justify-between">
                <span className="text-gray-500">Father&apos;s Name</span>
                <span>{data.student.fatherName as string}</span>
              </div>
            )}
          </div>
        </div>

        {/* Annual fee structure */}
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Annual Fee Structure</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-1 font-semibold text-gray-600 text-xs">Particular</th>
                <th className="text-right py-1 font-semibold text-gray-600 text-xs">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.structureRows.length === 0 ? (
                <tr><td colSpan={2} className="py-2 text-gray-400 text-center text-xs">(no structure)</td></tr>
              ) : (
                data.structureRows.map((row) => (
                  <tr key={row.label} className="border-b border-dashed border-gray-100">
                    <td className="py-1.5 pr-2">
                      <div className="text-xs">{row.label}</div>
                      {row.note && <div className="text-[10px] text-gray-400">{row.note}</div>}
                    </td>
                    <td className="py-1.5 text-right tabular-nums font-medium text-xs whitespace-nowrap">
                      {formatCurrency(row.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Amount received — hero box */}
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-4">
          <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">Amount Received (This Receipt)</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-gray-700">
                {data.quarterLabel ? \`Quarterly — \${data.quarterLabel}\` : "Fee payment"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 capitalize">
                Mode: {(payment.paymentMode as string).replace("_", " ")}
              </p>
            </div>
            <p className="text-3xl font-black text-primary tabular-nums">{formatCurrency(data.currentPayment)}</p>
          </div>
        </div>

        {/* Payment summary */}
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Payment Summary</p>
          <div className="space-y-1">
            {[
              { label: "Yearly Gross Total", value: formatCurrency(data.grossTotal as number), cls: "" },
              ...(data.structureDiscount > 0 ? [{ label: "Class Discount", value: \`− \${formatCurrency(data.structureDiscount)}\`, cls: "text-emerald-700" }] : []),
              ...(data.studentDiscount > 0 ? [{ label: "Student Discount", value: \`− \${formatCurrency(data.studentDiscount)}\`, cls: "text-emerald-700" }] : []),
              ...(data.totalDiscount > 0 ? [{ label: "Total Discount", value: \`− \${formatCurrency(data.totalDiscount)}\`, cls: "text-emerald-600 font-semibold" }] : []),
              { label: "Net Annual Fee", value: formatCurrency(data.totalFee), cls: "font-semibold" },
              { label: "Paid Before This Receipt", value: formatCurrency(data.paidBefore), cls: "" },
              { label: "This Payment", value: formatCurrency(data.currentPayment), cls: "font-bold text-primary bg-primary/5 -mx-1 px-1 rounded" },
              { label: "Total Paid Till Date", value: formatCurrency(data.paidAmount), cls: "font-semibold" },
              { label: "Balance Due", value: formatCurrency(data.balance), cls: data.balance === 0 ? "text-emerald-700 font-bold" : "text-amber-700 font-bold" },
            ].map((row) => (
              <div key={row.label} className={\`flex justify-between py-1 text-xs border-b border-dashed border-gray-100 last:border-0 \${row.cls}\`}>
                <span className="text-gray-700">{row.label}</span>
                <span className="tabular-nums">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-dashed border-gray-200 pt-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-gray-400 mb-0.5">Collected By</p>
            <p className="font-semibold">{(data.collectedBy?.name || userName) ?? "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 mb-0.5">Parent / Guardian Signature</p>
            <div className="border-b border-gray-400 mt-5 mb-1" />
          </div>
        </div>

        <p className="text-center text-[9px] text-gray-300">
          Computer-generated receipt. Please keep for your records.
        </p>
      </div>
    </div>
  );
}

// ── Data builder ─────────────────────────────────────────────────────────────
function buildData(payment: Record<string, unknown> | null) {
  if (!payment) return null;
  const student = payment.studentId as Record<string, unknown>;
  const cls = student.classId as { name: string };
  const sec = student.sectionId as { name: string };
  const session = payment.sessionId as { name: string } | null;
  const breakdown = (payment.feeBreakdown || {}) as Breakdown;
  const collectedBy = payment.collectedBy as { name: string };
  const quarter = payment.quarter as number | undefined;
  const currentPayment = payment.currentPayment as number;
  const paidAmount = payment.paidAmount as number;
  const paidBefore = paidAmount - currentPayment;

  return {
    student, cls, sec, session, breakdown, collectedBy, quarter,
    quarterLabel: quarter ? QUARTER_LABELS[quarter as QuarterNumber] : null,
    structureRows: getStructureRows(breakdown),
    currentPayment, paidBefore, paidAmount,
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReceiptPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const { user } = useAuth();
  const [payment, setPayment] = useState<Record<string, unknown> | null>(null);
  const [branding, setBranding] = useState<SchoolBranding>({ schoolName: "", appName: "", logo: "", address: "", phone: "", email: "" });
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      feePaymentsApi.getById(id),
      settingsApi.get().catch(() => null),
    ])
      .then(([paymentRes, settingsRes]) => {
        setPayment((paymentRes as { data: Record<string, unknown> }).data);
        const settings = (settingsRes as { data?: Partial<SchoolBranding> } | null)?.data;
        setBranding(parseSchoolBranding(settings));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const data = useMemo(() => buildData(payment), [payment]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    if (!payment || !data) return;
    const doc = new jsPDF({ format: "a5" });
    let y = 12;
    const schoolName = getReceiptSchoolName(branding);

    // Header
    if (schoolName) {
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      const lines = doc.splitTextToSize(schoolName, 130);
      doc.text(lines, 74, y, { align: "center" });
      y += lines.length * 5.5;
    }
    if (branding.address) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const aLines = doc.splitTextToSize(branding.address, 130);
      doc.text(aLines, 74, y, { align: "center" });
      y += aLines.length * 4;
    }
    if (branding.phone) { doc.text(\`Ph: \${branding.phone}\`, 74, y, { align: "center" }); y += 4; }
    y += 2;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("FEE PAYMENT RECEIPT", 74, y, { align: "center" });
    y += 8;

    // Receipt meta
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(\`Receipt No: \${payment.receiptNumber}\`, 10, y);
    doc.text(\`Date: \${formatDate(payment.paymentDate as string)}\`, 148 - 10, y, { align: "right" });
    y += 5;
    if (data.session?.name) doc.text(\`Session: \${data.session.name}\`, 10, y);
    if (data.quarterLabel) doc.text(\`Quarter: \${data.quarterLabel}\`, 148 - 10, y, { align: "right" });
    y += 8;

    // Student
    doc.setFont("helvetica", "bold");
    doc.text(\`Student: \${data.student.studentName}\`, 10, y); y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(\`Reg No: \${data.student.registrationNumber}  |  Class: \${data.cls?.name}-\${data.sec?.name}\`, 10, y);
    if (data.student.fatherName) doc.text(\`Father: \${data.student.fatherName}\`, 100, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Annual Fee Structure", "Amount"]],
      body: data.structureRows.map((r) => [r.label + (r.note ? \`\\n\${r.note}\` : ""), formatCurrency(r.amount)]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      columnStyles: { 1: { halign: "right", cellWidth: 30 } },
      pageBreak: "auto",
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    const summaryRows: string[][] = [
      ["Yearly Gross Total", formatCurrency(data.grossTotal as number)],
    ];
    if (data.structureDiscount > 0) summaryRows.push(["Class Discount", \`- \${formatCurrency(data.structureDiscount)}\`]);
    if (data.studentDiscount > 0) summaryRows.push(["Student Discount", \`- \${formatCurrency(data.studentDiscount)}\`]);
    summaryRows.push(
      ["Net Annual Fee", formatCurrency(data.totalFee)],
      ["Paid Before This Receipt", formatCurrency(data.paidBefore)],
      ["★ THIS PAYMENT RECEIVED", formatCurrency(data.currentPayment)],
      ["Total Paid Till Date", formatCurrency(data.paidAmount)],
      ["Balance Due", formatCurrency(data.balance)],
      ["Fee Status", data.paymentStatus.toUpperCase()],
    );

    autoTable(doc, {
      startY: y,
      head: [["Payment Summary", ""]],
      body: summaryRows,
      styles: { fontSize: 8.5, cellPadding: 2 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      columnStyles: { 1: { halign: "right", cellWidth: 35 } },
      didParseCell: (hookData) => {
        if (hookData.row.index === 5 && hookData.section === "body") {
          hookData.cell.styles.fontStyle = "bold";
          hookData.cell.styles.textColor = [37, 99, 235];
        }
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    doc.setFontSize(8);
    doc.text(\`Payment Mode: \${(payment.paymentMode as string).replace("_", " ")}\`, 10, y); y += 4;
    doc.text(\`Collected By: \${data.collectedBy?.name || user?.name || ""}\`, 10, y); y += 4;

    // PAID watermark
    if (data.paymentStatus === "paid") {
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(48);
      doc.setFont("helvetica", "bold");
      doc.text("PAID", 74, 100, { align: "center", angle: 30 });
      doc.setTextColor(0, 0, 0);
    }

    doc.save(\`\${payment.receiptNumber}.pdf\`);
  };

  if (loading || !payment || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading receipt…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{\`
        @media print {
          @page { margin: 8mm; size: A5 portrait; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; break-before: page; }
          .receipt-card { box-shadow: none !important; border-color: #ccc !important; border-radius: 0 !important; }
          .h-2 { print-color-adjust: exact; }
        }
      \`}</style>

      <div className="min-h-screen bg-muted/50 p-4 print:p-0 print:bg-white">
        {/* Toolbar */}
        <div className="max-w-2xl mx-auto mb-5 flex items-center gap-2 no-print">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print Slip
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            Printing will show school copy + parent copy
          </span>
        </div>

        {/* Two copies side by side on screen, stacked on print */}
        <div ref={receiptRef} className="max-w-2xl mx-auto space-y-5 print:space-y-0">
          {/* School Copy */}
          <ReceiptBody
            data={data}
            payment={payment}
            branding={branding}
            userName={user?.name}
            copyLabel="School Copy"
          />

          {/* Parent Copy */}
          <div className="print-break">
            <ReceiptBody
              data={data}
              payment={payment}
              branding={branding}
              userName={user?.name}
              copyLabel="Parent Copy"
            />
          </div>
        </div>
      </div>
    </>
  );
}
`;

fs.writeFileSync(
  path.join(__dirname, '../src/app/receipt/[id]/page.tsx'),
  content,
  'utf8'
);
console.log('receipt/[id]/page.tsx written OK');
