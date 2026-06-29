"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { feePaymentsApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { FeeCalculation } from "@/types";

export default function CollectFeePage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params?.studentId ?? "";
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [student, setStudent] = useState<Record<string, unknown> | null>(null);
  const [calculation, setCalculation] = useState<FeeCalculation | null>(null);
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    feePaymentsApi
      .getStudentSummary(studentId)
      .then((res) => {
        const data = (res as { data: Record<string, unknown> }).data;
        setStudent((data.student as Record<string, unknown>) ?? null);
        setCalculation((data.calculation as FeeCalculation | null) ?? null);
        setPayments((data.payments as Record<string, unknown>[]) ?? []);
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load student details",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  const handleCollect = async () => {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Error", description: "Enter valid payment amount", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await feePaymentsApi.collect({
        studentId,
        paymentAmount: amount,
        paymentMode,
        remarks,
      }) as { data: { _id: string } };
      toast({ title: "Success", description: "Fee collected successfully" });
      router.push(`/receipt/${res.data._id}`);
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <DashboardLayout><div className="text-center py-12">Loading...</div></DashboardLayout>;
  }

  if (!student) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Collect Fee"
          description="Student not found"
          breadcrumbs={[{ label: "Fee Collection", href: "/fee-collection" }, { label: "Collect" }]}
        />
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Student details not available. Please go back and select a student again.
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const cls = student?.classId as { name: string };
  const sec = student?.sectionId as { name: string };

  return (
    <DashboardLayout>
      <PageHeader
        title="Collect Fee"
        description={`${student?.studentName as string} - ${student?.registrationNumber as string}`}
        breadcrumbs={[{ label: "Fee Collection", href: "/fee-collection" }, { label: "Collect" }]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Student Details</CardTitle></CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Class</span><strong>{cls?.name}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Section</span><strong>{sec?.name}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Father</span><strong>{student?.fatherName as string}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mobile</span><strong>{student?.mobileNumber as string}</strong></div>
            </CardContent>
          </Card>

          {calculation && (
            <Card>
              <CardHeader><CardTitle>Fee Breakdown (Backend Calculated)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow><TableCell>Admission Fee</TableCell><TableCell className="text-right">{formatCurrency(calculation.feeBreakdown.admissionFee)}</TableCell></TableRow>
                    <TableRow><TableCell>Monthly Fee (×12)</TableCell><TableCell className="text-right">{formatCurrency(calculation.feeBreakdown.monthlyFee)}</TableCell></TableRow>
                    <TableRow><TableCell>Computer Fee</TableCell><TableCell className="text-right">{formatCurrency(calculation.feeBreakdown.computerFee)}</TableCell></TableRow>
                    <TableRow><TableCell>Exam Fee</TableCell><TableCell className="text-right">{formatCurrency(calculation.feeBreakdown.examFee)}</TableCell></TableRow>
                    <TableRow><TableCell>Other Fee</TableCell><TableCell className="text-right">{formatCurrency(calculation.feeBreakdown.otherFee)}</TableCell></TableRow>
                    <TableRow className="font-bold"><TableCell>Total Fee</TableCell><TableCell className="text-right text-primary">{formatCurrency(calculation.totalFee)}</TableCell></TableRow>
                    <TableRow><TableCell>Paid Amount</TableCell><TableCell className="text-right text-emerald-600">{formatCurrency(calculation.paidAmount)}</TableCell></TableRow>
                    <TableRow><TableCell>Previous Due</TableCell><TableCell className="text-right text-amber-600">{formatCurrency(calculation.previousDue)}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {!calculation && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                  Is class/session ke liye Fee Structure set nahi hai. Fee collect karne se pehle{" "}
                  <button
                    type="button"
                    className="font-semibold underline"
                    onClick={() => router.push("/fee-structure")}
                  >
                    Fee Structure
                  </button>{" "}
                  banayein.
                </div>
              )}
              <FormField label="Payment Amount" required>
                <Input
                  type="number"
                  min={1}
                  max={calculation?.previousDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max: ${formatCurrency(calculation?.previousDue || 0)}`}
                />
              </FormField>
              <FormField label="Payment Mode" required>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["cash", "upi", "card", "cheque", "bank_transfer"].map((m) => (
                      <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Remarks">
                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks" />
              </FormField>
              <Button className="w-full" onClick={handleCollect} disabled={submitting || !calculation?.previousDue}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Payment
              </Button>
            </CardContent>
          </Card>

          {payments.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {payments.map((p) => (
                  <div key={p._id as string} className="flex justify-between items-center p-3 rounded-lg bg-muted text-sm">
                    <div>
                      <p className="font-medium">{p.receiptNumber as string}</p>
                      <p className="text-muted-foreground">{formatDate(p.paymentDate as string)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(p.currentPayment as number)}</p>
                      <Badge variant={p.paymentStatus === "paid" ? "success" : "warning"}>{p.paymentStatus as string}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
