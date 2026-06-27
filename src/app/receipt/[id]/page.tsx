"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { feePaymentsApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SCHOOL_NAME = process.env.NEXT_PUBLIC_SCHOOL_NAME || "Delhi Public School";

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [payment, setPayment] = useState<Record<string, unknown> | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feePaymentsApi.getById(id).then((res) => setPayment((res as { data: Record<string, unknown> }).data));
  }, [id]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    if (!payment) return;
    const student = payment.studentId as Record<string, unknown>;
    const cls = student.classId as { name: string };
    const sec = student.sectionId as { name: string };
    const breakdown = payment.feeBreakdown as Record<string, number>;
    const collectedBy = payment.collectedBy as { name: string };

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(SCHOOL_NAME, 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("Fee Receipt", 105, 30, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Receipt No: ${payment.receiptNumber}`, 20, 45);
    doc.text(`Date: ${formatDate(payment.paymentDate as string)}`, 120, 45);
    doc.text(`Student: ${student.studentName}`, 20, 55);
    doc.text(`Reg No: ${student.registrationNumber}`, 20, 62);
    doc.text(`Class: ${cls?.name} - ${sec?.name}`, 20, 69);

    autoTable(doc, {
      startY: 78,
      head: [["Fee Type", "Amount"]],
      body: [
        ["Admission Fee", formatCurrency(breakdown.admissionFee)],
        ["Monthly Fee", formatCurrency(breakdown.monthlyFee)],
        ["Computer Fee", formatCurrency(breakdown.computerFee)],
        ["Exam Fee", formatCurrency(breakdown.examFee)],
        ["Transport Fee", formatCurrency(breakdown.transportFee)],
        ["Other Fee", formatCurrency(breakdown.otherFee)],
      ],
    });

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.text(`Total Fee: ${formatCurrency(payment.totalFee as number)}`, 20, finalY);
    doc.text(`Paid Amount: ${formatCurrency(payment.paidAmount as number)}`, 20, finalY + 7);
    doc.text(`Current Payment: ${formatCurrency(payment.currentPayment as number)}`, 20, finalY + 14);
    doc.text(`Remaining: ${formatCurrency(payment.balance as number)}`, 20, finalY + 21);
    doc.text(`Payment Mode: ${(payment.paymentMode as string).replace("_", " ")}`, 20, finalY + 28);
    doc.text(`Collected By: ${collectedBy?.name}`, 20, finalY + 35);

    doc.save(`${payment.receiptNumber}.pdf`);
  };

  if (!payment) {
    return <div className="flex items-center justify-center min-h-screen">Loading receipt...</div>;
  }

  const student = payment.studentId as Record<string, unknown>;
  const cls = student.classId as { name: string };
  const sec = student.sectionId as { name: string };
  const breakdown = payment.feeBreakdown as Record<string, number>;
  const collectedBy = payment.collectedBy as { name: string };

  return (
    <div className="min-h-screen bg-muted p-4 print:p-0 print:bg-white">
      <div className="max-w-2xl mx-auto mb-4 flex gap-2 print:hidden">
        <Button onClick={handlePrint}><Printer className="h-4 w-4 mr-2" /> Print</Button>
        <Button variant="outline" onClick={handleDownloadPDF}><Download className="h-4 w-4 mr-2" /> Download PDF</Button>
      </div>

      <div ref={receiptRef} className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 print:shadow-none print:rounded-none">
        <div className="text-center border-b pb-6 mb-6">
          <h1 className="text-2xl font-bold text-primary">{SCHOOL_NAME}</h1>
          <p className="text-muted-foreground mt-1">Fee Payment Receipt</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-muted-foreground">Receipt Number</p>
            <p className="font-bold text-lg">{payment.receiptNumber as string}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Payment Date</p>
            <p className="font-bold">{formatDate(payment.paymentDate as string)}</p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mb-6 text-sm space-y-1">
          <p><span className="text-muted-foreground">Student:</span> <strong>{student.studentName as string}</strong></p>
          <p><span className="text-muted-foreground">Registration No:</span> <strong>{student.registrationNumber as string}</strong></p>
          <p><span className="text-muted-foreground">Class:</span> <strong>{cls?.name} - {sec?.name}</strong></p>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Fee Type</th>
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Admission Fee", breakdown.admissionFee],
              ["Monthly Fee (Annual)", breakdown.monthlyFee],
              ["Computer Fee", breakdown.computerFee],
              ["Exam Fee", breakdown.examFee],
              ["Transport Fee", breakdown.transportFee],
              ["Other Fee", breakdown.otherFee],
            ].map(([label, amount]) => (
              <tr key={label as string} className="border-b border-dashed">
                <td className="py-2">{label}</td>
                <td className="py-2 text-right">{formatCurrency(amount as number)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-2 text-sm border-t pt-4">
          <div className="flex justify-between"><span>Total Fee</span><strong>{formatCurrency(payment.totalFee as number)}</strong></div>
          <div className="flex justify-between"><span>Paid Amount (Total)</span><strong className="text-emerald-600">{formatCurrency(payment.paidAmount as number)}</strong></div>
          <div className="flex justify-between"><span>Current Payment</span><strong className="text-primary text-lg">{formatCurrency(payment.currentPayment as number)}</strong></div>
          <div className="flex justify-between"><span>Remaining Amount</span><strong className="text-amber-600">{formatCurrency(payment.balance as number)}</strong></div>
          <div className="flex justify-between"><span>Payment Mode</span><strong className="capitalize">{(payment.paymentMode as string).replace("_", " ")}</strong></div>
          <div className="flex justify-between"><span>Collected By</span><strong>{collectedBy?.name || user?.name}</strong></div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
          <p>This is a computer-generated receipt. No signature required.</p>
        </div>
      </div>
    </div>
  );
}
