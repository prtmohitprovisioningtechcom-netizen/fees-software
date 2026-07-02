"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { Printer, Download } from "lucide-react";
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
      note: `${formatCurrency(monthlyRate)}/month · ${formatCurrency(quarterly)} per quarter`,
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
      label: "Transport (Annual)",
      amount: b.transportFee,
      note: "11 months — Q1: 2mo, Q2–Q4: 3mo each",
    });
  }
  return rows;
}

function ReceiptSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5", className)}>
      <h2 className="text-xs font-bold uppercase tracking-wide text-gray-600 border-b border-gray-300 pb-1 mb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, value, bold, highlight, negative }: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
  negative?: boolean;
}) {
  return (
    <div className={cn(
      "flex justify-between py-1.5 text-sm border-b border-dashed border-gray-200 last:border-0",
      bold && "font-semibold",
      highlight && "bg-primary/5 -mx-2 px-2 rounded"
    )}>
      <span className="text-gray-700">{label}</span>
      <span className={cn(
        "tabular-nums",
        negative && "text-emerald-700",
        highlight && "text-primary font-bold text-base"
      )}>{value}</span>
    </div>
  );
}

export default function ReceiptPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { user } = useAuth();
  const [payment, setPayment] = useState<Record<string, unknown> | null>(null);
  const [branding, setBranding] = useState<SchoolBranding>({
    schoolName: "",
    appName: "",
    logo: "",
    address: "",
    phone: "",
    email: "",
  });
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

  const data = useMemo(() => {
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
      student,
      cls,
      sec,
      session,
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
  }, [payment]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    if (!payment || !data) return;
    const doc = new jsPDF();
    let y = 15;
    const schoolName = getReceiptSchoolName(branding);

    if (schoolName) {
      doc.setFontSize(14);
      const nameLines = doc.splitTextToSize(schoolName, 175);
      doc.text(nameLines, 105, y, { align: "center" });
      y += nameLines.length * 5.5;
    }
    if (branding.schoolName && branding.appName && branding.schoolName !== branding.appName) {
      doc.setFontSize(9);
      doc.text(branding.appName, 105, y, { align: "center" });
      y += 5;
    }
    y += 1;
    doc.setFontSize(8);
    if (branding.address) {
      const addressLines = doc.splitTextToSize(branding.address, 170);
      doc.text(addressLines, 105, y, { align: "center" });
      y += addressLines.length * 4;
    }
    if (branding.phone) {
      doc.text(`Phone: ${branding.phone}`, 105, y, { align: "center" });
      y += 4;
    }
    if (branding.email) {
      doc.text(`Email: ${branding.email}`, 105, y, { align: "center" });
      y += 4;
    }
    y += 2;
    doc.setFontSize(11);
    doc.text("FEE PAYMENT RECEIPT", 105, y, { align: "center" });
    y += 12;

    doc.setFontSize(9);
    doc.text(`Receipt: ${payment.receiptNumber}`, 14, y);
    doc.text(`Date: ${formatDate(payment.paymentDate as string)}`, 120, y);
    y += 6;
    if (data.session?.name) doc.text(`Session: ${data.session.name}`, 14, y);
    if (data.quarterLabel) doc.text(`Quarter: ${data.quarterLabel}`, 120, y);
    y += 8;

    doc.text(`Student: ${data.student.studentName}`, 14, y);
    y += 5;
    doc.text(`Reg No: ${data.student.registrationNumber}  |  Class: ${data.cls?.name}-${data.sec?.name}`, 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Annual Fee Structure", "Amount"]],
      body: data.structureRows.map((r) => [r.label, formatCurrency(r.amount)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [60, 60, 60] },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    const summaryRows: string[][] = [
      ["Yearly Gross Total", formatCurrency(data.grossTotal as number)],
    ];
    if (data.structureDiscount > 0) summaryRows.push(["Class Discount", `− ${formatCurrency(data.structureDiscount)}`]);
    if (data.studentDiscount > 0) summaryRows.push(["Student Discount", `− ${formatCurrency(data.studentDiscount)}`]);
    summaryRows.push(["Net Annual Fee", formatCurrency(data.totalFee)]);
    summaryRows.push(["Paid Before This Receipt", formatCurrency(data.paidBefore)]);
    summaryRows.push(["This Payment Received", formatCurrency(data.currentPayment)]);
    summaryRows.push(["Total Paid Till Date", formatCurrency(data.paidAmount)]);
    summaryRows.push(["Balance Due", formatCurrency(data.balance)]);

    autoTable(doc, {
      startY: y,
      head: [["Payment Summary", ""]],
      body: summaryRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    doc.text(`Payment Mode: ${(payment.paymentMode as string).replace("_", " ")}`, 14, y);
    y += 5;
    doc.text(`Collected By: ${data.collectedBy?.name || user?.name}`, 14, y);
    y += 5;
    doc.text(`Status: ${(data.paymentStatus as string).toUpperCase()}`, 14, y);

    doc.save(`${payment.receiptNumber}.pdf`);
  };

  if (loading || !payment || !data) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading receipt...</div>;
  }

  const statusLabel =
    data.paymentStatus === "paid" ? "Fully Paid" : data.paymentStatus === "partial" ? "Partially Paid" : "Pending";

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 12mm; size: A5 portrait; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .receipt-print { box-shadow: none !important; border: 1px solid #ccc !important; max-width: 100% !important; padding: 16px !important; }
          .receipt-print h1 { font-size: 1.15rem !important; line-height: 1.35 !important; white-space: normal !important; word-break: break-word !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-muted p-4 print:p-0 print:bg-white">
        <div className="max-w-lg mx-auto mb-4 flex gap-2 no-print">
          <Button onClick={handlePrint}><Printer className="h-4 w-4 mr-2" /> Print Slip</Button>
          <Button variant="outline" onClick={handleDownloadPDF}><Download className="h-4 w-4 mr-2" /> Download PDF</Button>
        </div>

        <div
          ref={receiptRef}
          className="receipt-print max-w-lg mx-auto bg-white rounded-lg shadow-md border p-6 print:shadow-none text-gray-900"
        >
          {/* Header */}
          <SchoolHeader
            branding={branding}
            subtitle="Fee Payment Receipt"
            variant="receipt"
            showLogo={Boolean(branding.logo)}
          />

          {/* Receipt meta */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-4">
            <div>
              <span className="text-gray-500 text-xs">Receipt No.</span>
              <p className="font-bold font-mono">{payment.receiptNumber as string}</p>
            </div>
            <div className="text-right">
              <span className="text-gray-500 text-xs">Date</span>
              <p className="font-semibold">{formatDate(payment.paymentDate as string)}</p>
            </div>
            {data.session?.name && (
              <div>
                <span className="text-gray-500 text-xs">Session</span>
                <p className="font-semibold">{data.session.name}</p>
              </div>
            )}
            {data.quarterLabel && (
              <div className="text-right">
                <span className="text-gray-500 text-xs">Payment For</span>
                <p className="font-semibold text-primary">{data.quarterLabel}</p>
              </div>
            )}
          </div>

          {/* Student */}
          <div className="bg-gray-50 border rounded-md p-3 mb-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Student</span>
              <strong>{data.student.studentName as string}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Reg. No.</span>
              <span>{data.student.registrationNumber as string}</span>
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

          {/* Annual structure */}
          <ReceiptSection title="Annual Fee Structure">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1 font-semibold text-gray-600">Particular</th>
                  <th className="text-right py-1 font-semibold text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.structureRows.length === 0 ? (
                  <tr><td colSpan={2} className="py-2 text-gray-500 text-center">—</td></tr>
                ) : (
                  data.structureRows.map((row) => (
                    <tr key={row.label} className="border-b border-dashed border-gray-200">
                      <td className="py-1.5 pr-2">
                        <div>{row.label}</div>
                        {row.note && <div className="text-[10px] text-gray-500">{row.note}</div>}
                      </td>
                      <td className="py-1.5 text-right tabular-nums font-medium whitespace-nowrap">
                        {formatCurrency(row.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ReceiptSection>

          {/* This payment - highlighted */}
          <div className="border-2 border-primary rounded-lg p-3 mb-4 bg-primary/5">
            <p className="text-xs font-bold uppercase text-primary mb-2">Amount Received (This Receipt)</p>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                {data.quarterLabel ? `Quarterly fee — ${data.quarterLabel}` : "Fee payment"}
                <div className="text-xs text-gray-500 capitalize mt-0.5">
                  Mode: {(payment.paymentMode as string).replace("_", " ")}
                </div>
              </div>
              <p className="text-2xl font-bold text-primary tabular-nums">
                {formatCurrency(data.currentPayment)}
              </p>
            </div>
          </div>

          {/* Account summary */}
          <ReceiptSection title="Payment Summary">
            <Row label="Yearly Gross Total" value={formatCurrency(data.grossTotal as number)} />
            {data.structureDiscount > 0 && (
              <Row label="Class Discount" value={`− ${formatCurrency(data.structureDiscount)}`} negative />
            )}
            {data.studentDiscount > 0 && (
              <Row label="Student Discount" value={`− ${formatCurrency(data.studentDiscount)}`} negative />
            )}
            {(data.totalDiscount as number) > 0 && (
              <Row label="Total Discount" value={`− ${formatCurrency(data.totalDiscount as number)}`} negative />
            )}
            <Row label="Net Annual Fee" value={formatCurrency(data.totalFee)} bold />
            <Row label="Paid Before This Receipt" value={formatCurrency(data.paidBefore)} />
            <Row label="This Payment" value={formatCurrency(data.currentPayment)} highlight />
            <Row label="Total Paid Till Date" value={formatCurrency(data.paidAmount)} bold />
            <Row
              label="Balance Due"
              value={formatCurrency(data.balance)}
              bold
              highlight={data.balance === 0}
            />
            <Row label="Fee Status" value={statusLabel} bold />
          </ReceiptSection>

          {data.remarks && (
            <ReceiptSection title="Remarks">
              <p className="text-sm text-gray-700">{data.remarks}</p>
            </ReceiptSection>
          )}

          {/* Footer */}
          <div className="border-t pt-4 mt-2 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Collected By</p>
              <p className="font-semibold">{data.collectedBy?.name || user?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs">Parent / Guardian</p>
              <div className="border-b border-gray-400 mt-6 mb-1" />
              <p className="text-[10px] text-gray-400">Signature</p>
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-400 mt-4">
            Computer-generated receipt. Please keep for your records.
          </p>
        </div>
      </div>
    </>
  );
}
