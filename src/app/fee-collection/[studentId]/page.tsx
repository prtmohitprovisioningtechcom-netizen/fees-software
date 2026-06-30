"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Percent } from "lucide-react";
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
import { feePaymentsApi, sessionsApi, studentsApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { FeeCalculation } from "@/types";

interface Session {
  _id: string;
  name: string;
  isCurrent?: boolean;
}

function CollectFeePageContent() {
  const params = useParams<{ studentId: string }>();
  const searchParams = useSearchParams();
  const studentId = params?.studentId ?? "";
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [student, setStudent] = useState<Record<string, unknown> | null>(null);
  const [session, setSession] = useState<{ _id: string; name: string } | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionId, setSessionId] = useState(searchParams?.get("sessionId") || "");
  const [calculation, setCalculation] = useState<FeeCalculation | null>(null);
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [remarks, setRemarks] = useState("");
  const [studentDiscount, setStudentDiscount] = useState("0");

  const loadSummary = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await feePaymentsApi.getStudentSummary(studentId, sessionId || undefined);
      const data = (res as { data: Record<string, unknown> }).data;
      const studentData = (data.student as Record<string, unknown>) ?? null;
      setStudent(studentData);
      setSession((data.session as { _id: string; name: string }) ?? null);
      if (!sessionId && data.session) {
        setSessionId((data.session as { _id: string })._id);
      }
      setCalculation((data.calculation as FeeCalculation | null) ?? null);
      setPayments((data.payments as Record<string, unknown>[]) ?? []);
      setStudentDiscount(String((studentData?.feeDiscount as number) || 0));
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load student details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [studentId, sessionId]);

  useEffect(() => {
    sessionsApi.getAll().then((res) => {
      const list = (res as { data: Session[] }).data || [];
      setSessions(list);
    });
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const applyDiscount = async () => {
    setApplyingDiscount(true);
    try {
      await studentsApi.updateFeeDiscount(studentId, Number(studentDiscount) || 0);
      toast({ title: "Discount Applied", description: "Fee updated with new discount" });
      await loadSummary();
      setPaymentAmount("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply discount",
        variant: "destructive",
      });
    } finally {
      setApplyingDiscount(false);
    }
  };

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
        sessionId: session?._id || sessionId,
        feeDiscount: Number(studentDiscount) || 0,
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

  const previewNetDue = () => {
    if (!calculation) return 0;
    const gross = calculation.grossTotal;
    const structureDiscount = calculation.feeBreakdown.structureDiscount || 0;
    const newStudentDiscount = Number(studentDiscount) || 0;
    const totalDiscount = Math.min(gross, structureDiscount + newStudentDiscount);
    const netTotal = gross - totalDiscount;
    const paidBefore = calculation.paidAmount - (calculation.currentPayment || 0);
    return Math.max(0, netTotal - paidBefore);
  };

  const discountChanged =
    calculation &&
    Number(studentDiscount) !== (calculation.feeBreakdown.studentDiscount || 0);

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
  const maxPayable = discountChanged ? previewNetDue() : (calculation?.previousDue || 0);

  return (
    <DashboardLayout>
      <PageHeader
        title="Collect Fee"
        description={`${student?.studentName as string} - ${student?.registrationNumber as string}`}
        breadcrumbs={[{ label: "Fee Collection", href: "/fee-collection" }, { label: "Collect" }]}
        action={
          <Select value={sessionId} onValueChange={setSessionId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.name}
                  {s.isCurrent ? " (Current)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {session && (
        <p className="text-sm text-muted-foreground mb-4">
          Collecting fee for session: <strong>{session.name}</strong>
        </p>
      )}

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
              <CardHeader><CardTitle>Fee Breakdown — {session?.name}</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow><TableCell>Admission Fee</TableCell><TableCell className="text-right">{formatCurrency(calculation.feeBreakdown.admissionFee)}</TableCell></TableRow>
                    <TableRow><TableCell>Monthly Fee (×12)</TableCell><TableCell className="text-right">{formatCurrency(calculation.feeBreakdown.monthlyFee)}</TableCell></TableRow>
                    <TableRow><TableCell>Annual Fee</TableCell><TableCell className="text-right">{formatCurrency(calculation.feeBreakdown.annualFee)}</TableCell></TableRow>
                    <TableRow><TableCell>Computer Fee</TableCell><TableCell className="text-right">{formatCurrency(calculation.feeBreakdown.computerFee)}</TableCell></TableRow>
                    <TableRow><TableCell>Exam Fee</TableCell><TableCell className="text-right">{formatCurrency(calculation.feeBreakdown.examFee)}</TableCell></TableRow>
                    <TableRow><TableCell>Other Fee</TableCell><TableCell className="text-right">{formatCurrency(calculation.feeBreakdown.otherFee)}</TableCell></TableRow>
                    <TableRow className="font-medium"><TableCell>Gross Total</TableCell><TableCell className="text-right">{formatCurrency(calculation.grossTotal)}</TableCell></TableRow>
                    {(calculation.feeBreakdown.structureDiscount || 0) > 0 && (
                      <TableRow className="text-emerald-600">
                        <TableCell>Class Default Discount</TableCell>
                        <TableCell className="text-right">− {formatCurrency(calculation.feeBreakdown.structureDiscount)}</TableCell>
                      </TableRow>
                    )}
                    {(Number(studentDiscount) || calculation.feeBreakdown.studentDiscount) > 0 && (
                      <TableRow className="text-emerald-600">
                        <TableCell>Student Discount</TableCell>
                        <TableCell className="text-right">
                          − {formatCurrency(Number(studentDiscount) || calculation.feeBreakdown.studentDiscount)}
                          {discountChanged && (
                            <Badge variant="warning" className="ml-2 text-[10px]">unsaved</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow className="font-bold"><TableCell>Net Total Fee</TableCell><TableCell className="text-right text-primary">{formatCurrency(discountChanged ? calculation.grossTotal - Math.min(calculation.grossTotal, (calculation.feeBreakdown.structureDiscount || 0) + (Number(studentDiscount) || 0)) : calculation.totalFee)}</TableCell></TableRow>
                    <TableRow><TableCell>Paid Amount</TableCell><TableCell className="text-right text-emerald-600">{formatCurrency(calculation.paidAmount - (calculation.currentPayment || 0))}</TableCell></TableRow>
                    <TableRow><TableCell>Pending / Due</TableCell><TableCell className="text-right text-amber-600 font-semibold">{formatCurrency(maxPayable)}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {calculation && (
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Percent className="h-4 w-4 text-emerald-600" />
                  Discount (Collection Time)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Apply an extra student discount here. The class default discount comes from Fee Structure.
                </p>
                {(calculation.feeBreakdown.structureDiscount || 0) > 0 && (
                  <div className="flex justify-between text-sm rounded-lg bg-muted/50 px-3 py-2">
                    <span>Class Default Discount</span>
                    <span className="font-medium text-emerald-600">− {formatCurrency(calculation.feeBreakdown.structureDiscount)}</span>
                  </div>
                )}
                <FormField label="Student Extra Discount (₹)">
                  <Input
                    type="number"
                    min={0}
                    value={studentDiscount}
                    onChange={(e) => setStudentDiscount(e.target.value)}
                    placeholder="0"
                  />
                </FormField>
                {discountChanged && (
                  <p className="text-xs text-amber-600">
                    Discount has changed — click Apply or it will be saved automatically when you submit payment.
                  </p>
                )}
                <Button
                  variant="outline"
                  className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={applyDiscount}
                  disabled={applyingDiscount}
                >
                  {applyingDiscount ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Percent className="h-4 w-4 mr-2" />}
                  Apply Discount
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {!calculation && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                  No fee structure exists for this class and session. Please create one in{" "}
                  <button
                    type="button"
                    className="font-semibold underline"
                    onClick={() => router.push("/fee-structure")}
                  >
                    Fee Structure
                  </button>{" "}
                  before collecting fees.
                </div>
              )}
              <FormField label="Payment Amount" required>
                <Input
                  type="number"
                  min={1}
                  max={maxPayable}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max: ${formatCurrency(maxPayable)}`}
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
              <Button className="w-full" onClick={handleCollect} disabled={submitting || !maxPayable}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Payment
              </Button>
            </CardContent>
          </Card>

          {payments.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Payment History — {session?.name}</CardTitle></CardHeader>
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

function CollectFeeFallback() {
  return (
    <DashboardLayout>
      <div className="text-center py-12 text-muted-foreground">Loading...</div>
    </DashboardLayout>
  );
}

export default function CollectFeePage() {
  return (
    <Suspense fallback={<CollectFeeFallback />}>
      <CollectFeePageContent />
    </Suspense>
  );
}
