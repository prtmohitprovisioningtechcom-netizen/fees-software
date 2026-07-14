"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Percent, CalendarRange, Receipt, Bus, History } from "lucide-react";
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
import { feePaymentsApi, sessionsApi, studentsApi, transportRoutesApi } from "@/lib/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { FeeCalculation } from "@/types";
import { TRANSPORT_MONTHS_BY_QUARTER } from "@/lib/fee-schedule";

interface Session {
  _id: string;
  name: string;
  isCurrent?: boolean;
}

type TransportRoute = { _id: string; name: string; monthlyFee: number };

type SessionArrear = {
  sessionId: string;
  sessionName: string;
  isCurrent: boolean;
  pendingAmount: number;
  paidAmount: number;
  totalFee: number;
  hasFeeStructure: boolean;
};

function SkeletonCard({ rows = 4 }: { rows?: number }) {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-5 bg-muted rounded w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-4 bg-muted rounded w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function getRouteId(student: Record<string, unknown> | null) {
  if (!student?.transportRouteId) return "";
  const ref = student.transportRouteId as { _id?: string } | string;
  return typeof ref === "string" ? ref : ref._id || "";
}

function matchSessionByName(name: string, sessions: Session[], excludeSessionId?: string) {
  const q = name.trim().toLowerCase();
  if (!q) return null;
  const candidates = sessions.filter((s) => s._id !== excludeSessionId);
  return candidates.find((s) => s.name.trim().toLowerCase() === q) || null;
}

function CollectFeePageContent() {
  const params = useParams<{ studentId: string }>();
  const searchParams = useSearchParams();
  const studentId = params?.studentId ?? "";
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingTransport, setSavingTransport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingDueId, setSubmittingDueId] = useState<string | null>(null);
  const [student, setStudent] = useState<Record<string, unknown> | null>(null);
  const [session, setSession] = useState<{ _id: string; name: string } | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionId, setSessionId] = useState(searchParams?.get("sessionId") || "");
  const [calculation, setCalculation] = useState<FeeCalculation | null>(null);
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);
  const [feeStructure, setFeeStructure] = useState<{ admissionFee?: number } | null>(null);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [remarks, setRemarks] = useState("");
  const [studentDiscount, setStudentDiscount] = useState("0");
  const [includeAdmission, setIncludeAdmission] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
  const [transportRequired, setTransportRequired] = useState(false);
  const [transportRouteId, setTransportRouteId] = useState("");
  const [sessionArrears, setSessionArrears] = useState<SessionArrear[]>([]);
  const [prevSessionName, setPrevSessionName] = useState("");
  const [prevAmount, setPrevAmount] = useState("");

  const prevCalcRef = useRef<FeeCalculation | null>(null);
  const prevStudentRef = useRef<Record<string, unknown> | null>(null);
  const autoQuarterRef = useRef<string>("");

  const loadSummary = useCallback(async (opts?: { soft?: boolean }) => {
    if (!studentId) return;
    if (!opts?.soft || !prevStudentRef.current) setLoading(true);
    try {
      const res = await feePaymentsApi.getStudentSummary(studentId, sessionId || undefined, includeAdmission);
      const data = (res as { data: Record<string, unknown> }).data;
      const studentData = (data.student as Record<string, unknown>) ?? null;
      const calc = (data.calculation as FeeCalculation | null) ?? null;
      prevStudentRef.current = studentData;
      prevCalcRef.current = calc;
      setStudent(studentData);
      setSession((data.session as { _id: string; name: string }) ?? null);
      if (!sessionId && data.session) {
        setSessionId((data.session as { _id: string })._id);
      }
      setCalculation(calc);
      setPayments((data.payments as Record<string, unknown>[]) ?? []);
      setFeeStructure((data.feeStructure as { admissionFee?: number }) ?? null);
      setSessionArrears((data.sessionArrears as SessionArrear[]) || []);
      setStudentDiscount(String((studentData?.feeDiscount as number) || 0));
      setTransportRequired(Boolean(studentData?.transportRequired));
      setTransportRouteId(getRouteId(studentData));

      const sid = (data.session as { _id: string } | null)?._id || sessionId;
      const loadKey = `${studentId}:${sid}:${includeAdmission}`;
      if (calc?.quarterlySchedule && autoQuarterRef.current !== loadKey) {
        autoQuarterRef.current = loadKey;
        const oldest = calc.quarterlySchedule.find((q) => q.pending > 0);
        if (oldest) {
          setSelectedQuarter(oldest.quarter);
          setPaymentAmount(String(Math.min(oldest.pending, calc.previousDue || oldest.pending)));
        } else {
          setSelectedQuarter(null);
          setPaymentAmount("");
        }
      }
    } catch (error) {
      if (prevStudentRef.current) setStudent(prevStudentRef.current);
      if (prevCalcRef.current) setCalculation(prevCalcRef.current);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load student details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [studentId, sessionId, includeAdmission]);

  useEffect(() => {
    Promise.all([sessionsApi.getAll(), transportRoutesApi.getAll()]).then(([sessionsRes, routesRes]) => {
      setSessions((sessionsRes as { data: Session[] }).data || []);
      setRoutes((routesRes as { data: TransportRoute[] }).data || []);
    });
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const saveTransport = async (required: boolean, routeId: string) => {
    if (required && !routeId) {
      toast({ title: "Route required", description: "Select a transport route", variant: "destructive" });
      return;
    }
    setSavingTransport(true);
    try {
      const formData = new FormData();
      formData.append("transportRequired", required ? "Yes" : "No");
      if (required && routeId) formData.append("transportRouteId", routeId);
      await studentsApi.update(studentId, formData);
      setSelectedQuarter(null);
      setPaymentAmount("");
      await loadSummary({ soft: true });
      toast({
        title: "Transport updated",
        description: required ? "Route fee added to quarterly schedule" : "Transport fee removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update transport",
        variant: "destructive",
      });
      setTransportRequired(Boolean(student?.transportRequired));
      setTransportRouteId(getRouteId(student));
    } finally {
      setSavingTransport(false);
    }
  };

  const openReceipt = (res: { data: { _id?: string; id?: string } }) => {
    const paymentId = String(res.data._id || res.data.id || "");
    if (!paymentId) {
      toast({ title: "Error", description: "Payment saved but receipt could not open", variant: "destructive" });
      return false;
    }
    window.location.href = `/receipt/${paymentId}?print=1`;
    return true;
  };

  const handleCollect = async () => {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Error", description: "Enter valid payment amount", variant: "destructive" });
      return;
    }
    if (transportRequired && !transportRouteId) {
      toast({ title: "Transport route needed", description: "Select a route before collecting", variant: "destructive" });
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
        includeAdmission,
        quarter: selectedQuarter || undefined,
        paymentType: selectedQuarter ? "quarterly" : "custom",
      }) as { data: { _id?: string; id?: string } };
      openReceipt(res);
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCollectPrevious = async () => {
    const amount = Number(prevAmount);
    const label = prevSessionName.trim();

    if (!label) {
      toast({ title: "Session required", description: "Type previous session name", variant: "destructive" });
      return;
    }
    if (!amount || amount <= 0) {
      toast({ title: "Error", description: "Enter valid amount for previous session", variant: "destructive" });
      return;
    }
    if (transportRequired && !transportRouteId) {
      toast({ title: "Transport route needed", description: "Select a route before collecting", variant: "destructive" });
      return;
    }
    const currentCollectSessionId = session?._id || sessionId;
    const matched = matchSessionByName(label, sessions, currentCollectSessionId);
    const arrear = matched ? sessionArrears.find((a) => a.sessionId === matched._id) : undefined;
    if (arrear && arrear.pendingAmount > 0 && amount > arrear.pendingAmount) {
      toast({
        title: "Amount too high",
        description: `Pending for this session is ${formatCurrency(arrear.pendingAmount)}`,
        variant: "destructive",
      });
      return;
    }
    setSubmittingDueId(`prev-${label}`);
    try {
      const res = await feePaymentsApi.collect({
        studentId,
        previousDues: true,
        sessionName: label,
        sessionId: session?._id || sessionId,
        feeDiscount: Number(studentDiscount) || 0,
        paymentAmount: amount,
        paymentMode,
        remarks: remarks || `Previous session dues — ${label}`,
        includeAdmission: false,
        paymentType: "custom",
      }) as { data: { _id?: string; id?: string } };
      openReceipt(res);
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally {
      setSubmittingDueId(null);
    }
  };

  const fillPreviousSession = (arrear: SessionArrear) => {
    setPrevSessionName(arrear.sessionName);
    setPrevAmount(arrear.pendingAmount > 0 ? String(arrear.pendingAmount) : "");
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

  const quarterStatusColor = (status: string) => {
    if (status === "paid") return "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40";
    if (status === "partial") return "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40";
    return "hover:border-primary/50";
  };

  const displayStudent = student ?? prevStudentRef.current;
  const displayCalc = calculation ?? prevCalcRef.current;
  const isInitialLoad = loading && !displayStudent;
  const selectedRoute = routes.find((r) => r._id === transportRouteId);

  if (isInitialLoad) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Collect Fee"
          description="Loading student details..."
          breadcrumbs={[{ label: "Fee Collection", href: "/fee-collection" }, { label: "Collect" }]}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <SkeletonCard rows={5} />
            <SkeletonCard rows={4} />
          </div>
          <div className="space-y-6">
            <SkeletonCard rows={3} />
            <SkeletonCard rows={4} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!displayStudent) {
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

  const cls = displayStudent?.classId as { name: string };
  const sec = displayStudent?.sectionId as { name: string };
  const maxPayable = discountChanged ? previewNetDue() : (displayCalc?.previousDue || 0);

  const selectQuarter = (quarter: number, quarterPending: number) => {
    const totalDue = discountChanged ? previewNetDue() : (displayCalc?.previousDue ?? 0);
    setSelectedQuarter(quarter);
    setPaymentAmount(String(Math.min(quarterPending, totalDue)));
  };

  const currentCollectSessionId = session?._id || sessionId;
  const matchedPrevSession = matchSessionByName(prevSessionName, sessions, currentCollectSessionId);
  const selectedPrevArrear = matchedPrevSession
    ? sessionArrears.find((a) => a.sessionId === matchedPrevSession._id)
    : undefined;
  const sessionsWithBalance = sessionArrears.filter((a) => a.pendingAmount > 0);
  const isSubmittingPrevious = Boolean(submittingDueId);

  return (
    <DashboardLayout>
      <PageHeader
        title="Collect Fee"
        description={`${displayStudent?.studentName as string} — ${displayStudent?.registrationNumber as string}`}
        breadcrumbs={[{ label: "Fee Collection", href: "/fee-collection" }, { label: "Collect" }]}
        action={
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}{s.isCurrent ? " ✓ Current" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><strong>{displayStudent?.studentName as string}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Class</span><strong>{cls?.name}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Section</span><strong>{sec?.name}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Father</span><strong>{displayStudent?.fatherName as string}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mobile</span><strong>{displayStudent?.mobileNumber as string}</strong></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bus className="h-4 w-4" />
                School Transport
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Uses school transport?">
                <Select
                  value={transportRequired ? "Yes" : "No"}
                  onValueChange={(value) => {
                    const required = value === "Yes";
                    setTransportRequired(required);
                    if (!required) {
                      setTransportRouteId("");
                      void saveTransport(false, "");
                    }
                  }}
                  disabled={savingTransport}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes — add route fee</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {transportRequired && (
                <FormField label="Transport route (village)">
                  <Select
                    value={transportRouteId || undefined}
                    onValueChange={(value) => {
                      setTransportRouteId(value);
                      void saveTransport(true, value);
                    }}
                    disabled={savingTransport}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select village / route" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route._id} value={route._id}>
                          {route.name} — {formatCurrency(route.monthlyFee)}/mo
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}

              {savingTransport && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Updating fees…
                </p>
              )}

              {selectedRoute && transportRequired && (
                <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs space-y-1">
                  <p className="font-medium">{selectedRoute.name}</p>
                  <p>Monthly: {formatCurrency(selectedRoute.monthlyFee)}</p>
                  <p>
                    Q1: {formatCurrency(selectedRoute.monthlyFee * TRANSPORT_MONTHS_BY_QUARTER[1])} ·
                    Q2–Q4: {formatCurrency(selectedRoute.monthlyFee * TRANSPORT_MONTHS_BY_QUARTER[2])} each
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {displayCalc && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarRange className="h-4 w-4" />
                    Quarterly Fee Schedule — {session?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer rounded-lg border px-3 py-2 bg-muted/30">
                    <input
                      type="checkbox"
                      checked={includeAdmission}
                      onChange={(e) => {
                        setIncludeAdmission(e.target.checked);
                        setSelectedQuarter(null);
                        setPaymentAmount("");
                      }}
                      className="rounded"
                    />
                    <span>
                      New student — include admission pack ({formatCurrency(feeStructure?.admissionFee || 0)} in Q1)
                    </span>
                  </label>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {displayCalc.quarterlySchedule?.map((q) => (
                      <button
                        key={q.quarter}
                        type="button"
                        disabled={q.status === "paid"}
                        onClick={() => selectQuarter(q.quarter, q.pending)}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-colors",
                          quarterStatusColor(q.status),
                          selectedQuarter === q.quarter && "ring-2 ring-primary"
                        )}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-semibold">{q.label}</p>
                          <Badge variant={q.status === "paid" ? "success" : q.status === "partial" ? "warning" : "secondary"}>
                            {q.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground space-y-0.5">
                          {(q.componentsDue || []).map((c) => (
                            <span key={c.key} className="block">{c.label}: {formatCurrency(c.amount)}</span>
                          ))}
                        </p>
                        <div className="flex justify-between mt-2 text-sm">
                          <span>Due: <strong>{formatCurrency(q.totalDue)}</strong></span>
                          <span className="text-amber-700 dark:text-amber-400 font-semibold">Pending: {formatCurrency(q.pending)}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Tap a quarter to auto-fill the due amount for that period.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-amber-300/70 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-amber-900 dark:text-amber-200">
                    <History className="h-4 w-4" />
                    Previous Session Dues
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-amber-800/90 dark:text-amber-300/90">
                    Type the session name manually — it will appear on the slip whether or not it exists in the system.
                  </p>

                  <FormField label="Previous session">
                    <Input
                      value={prevSessionName}
                      onChange={(e) => setPrevSessionName(e.target.value)}
                      placeholder="e.g. 2023-24 or any past session"
                      list="previous-session-suggestions"
                    />
                    <datalist id="previous-session-suggestions">
                      {sessionArrears.map((a) => (
                        <option key={a.sessionId} value={a.sessionName} />
                      ))}
                    </datalist>
                  </FormField>

                  {matchedPrevSession && selectedPrevArrear && (
                    <div className="grid grid-cols-3 gap-2 text-xs rounded-lg border bg-white/70 px-3 py-2 dark:bg-background/40">
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-semibold tabular-nums">{formatCurrency(selectedPrevArrear.totalFee)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Paid</p>
                        <p className="font-semibold tabular-nums text-emerald-600">{formatCurrency(selectedPrevArrear.paidAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pending</p>
                        <p className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                          {formatCurrency(selectedPrevArrear.pendingAmount)}
                        </p>
                      </div>
                    </div>
                  )}

                  {matchedPrevSession && !selectedPrevArrear?.hasFeeStructure && selectedPrevArrear && (
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      No fee structure for this session — enter the amount manually.
                    </p>
                  )}

                  <FormField label="Amount to collect">
                    <Input
                      type="number"
                      min={1}
                      value={prevAmount}
                      onChange={(e) => setPrevAmount(e.target.value)}
                      placeholder={selectedPrevArrear?.pendingAmount
                        ? `Pending: ${formatCurrency(selectedPrevArrear.pendingAmount)}`
                        : "Enter amount"}
                    />
                  </FormField>

                  <Button
                    className="w-full"
                    disabled={isSubmittingPrevious || savingTransport || !prevSessionName.trim()}
                    onClick={handleCollectPrevious}
                  >
                    {isSubmittingPrevious ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Receipt className="h-4 w-4 mr-2" />
                    )}
                    Submit &amp; Print Slip
                  </Button>

                  {sessionsWithBalance.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-amber-200/80 dark:border-amber-900">
                      <p className="text-xs font-medium text-amber-900 dark:text-amber-200">Quick fill — outstanding balances</p>
                      {sessionsWithBalance.map((arrear) => (
                        <button
                          key={arrear.sessionId}
                          type="button"
                          className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white/80 px-3 py-2 text-left dark:border-amber-900 dark:bg-background/50 hover:bg-amber-50/80 dark:hover:bg-amber-950/30 transition-colors"
                          onClick={() => fillPreviousSession(arrear)}
                        >
                          <div>
                            <p className="text-sm font-semibold">{arrear.sessionName}</p>
                            <p className="text-xs text-muted-foreground">
                              Paid {formatCurrency(arrear.paidAmount)} · Due {formatCurrency(arrear.pendingAmount)}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                            {formatCurrency(arrear.pendingAmount)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Annual Fee Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      <TableRow><TableCell>Monthly Tuition (×12)</TableCell><TableCell className="text-right">{formatCurrency(displayCalc.feeBreakdown.monthlyFee)}</TableCell></TableRow>
                      <TableRow><TableCell>Quarterly Tuition (×3)</TableCell><TableCell className="text-right">{formatCurrency(displayCalc.feeBreakdown.quarterlyTuition || 0)}</TableCell></TableRow>
                      {includeAdmission && (
                        <TableRow><TableCell>Admission Pack (Q1)</TableCell><TableCell className="text-right">{formatCurrency(displayCalc.feeBreakdown.admissionFee)}</TableCell></TableRow>
                      )}
                      <TableRow><TableCell>Exam Fee</TableCell><TableCell className="text-right">{formatCurrency(displayCalc.feeBreakdown.examFee)}</TableCell></TableRow>
                      <TableRow><TableCell>ID Card / Diary / Syllabus</TableCell><TableCell className="text-right">{formatCurrency(displayCalc.feeBreakdown.computerFee)}</TableCell></TableRow>
                      <TableRow><TableCell>Annual / Development</TableCell><TableCell className="text-right">{formatCurrency(displayCalc.feeBreakdown.annualFee)}</TableCell></TableRow>
                      <TableRow><TableCell>Tour / Other</TableCell><TableCell className="text-right">{formatCurrency(displayCalc.feeBreakdown.otherFee)}</TableCell></TableRow>
                      {(displayCalc.feeBreakdown.transportFee || 0) > 0 && (
                        <TableRow>
                          <TableCell>
                            Transport (11 months)
                            {displayCalc.feeBreakdown.transportRouteName
                              ? ` — ${displayCalc.feeBreakdown.transportRouteName}`
                              : ""}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(displayCalc.feeBreakdown.transportFee)}</TableCell>
                        </TableRow>
                      )}
                      <TableRow className="font-medium border-t">
                        <TableCell>Yearly Gross Total</TableCell>
                        <TableCell className="text-right">{formatCurrency(displayCalc.grossTotal)}</TableCell>
                      </TableRow>
                      {(displayCalc.feeBreakdown.structureDiscount || 0) > 0 && (
                        <TableRow className="text-emerald-600 dark:text-emerald-400">
                          <TableCell>Class Default Discount</TableCell>
                          <TableCell className="text-right">− {formatCurrency(displayCalc.feeBreakdown.structureDiscount)}</TableCell>
                        </TableRow>
                      )}
                      {(Number(studentDiscount) || displayCalc.feeBreakdown.studentDiscount) > 0 && (
                        <TableRow className="text-emerald-600 dark:text-emerald-400">
                          <TableCell>Student Discount</TableCell>
                          <TableCell className="text-right">
                            − {formatCurrency(Number(studentDiscount) || displayCalc.feeBreakdown.studentDiscount)}
                            {discountChanged && <Badge variant="warning" className="ml-2 text-[10px]">preview</Badge>}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow className="font-bold">
                        <TableCell>Net Total Fee</TableCell>
                        <TableCell className="text-right text-primary">
                          {formatCurrency(discountChanged
                            ? displayCalc.grossTotal - Math.min(displayCalc.grossTotal, (displayCalc.feeBreakdown.structureDiscount || 0) + (Number(studentDiscount) || 0))
                            : displayCalc.totalFee)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Paid Amount</TableCell>
                        <TableCell className="text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(displayCalc.paidAmount - (displayCalc.currentPayment || 0))}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Pending / Due</TableCell>
                        <TableCell className="text-right text-amber-600 dark:text-amber-400 font-semibold">{formatCurrency(maxPayable)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="space-y-6">
          {displayCalc && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Percent className="h-4 w-4 text-emerald-600" />
                  Student Discount (₹)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(displayCalc.feeBreakdown.structureDiscount || 0) > 0 && (
                  <div className="flex justify-between text-sm rounded-lg bg-muted/50 px-3 py-2">
                    <span>Class default discount</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      − {formatCurrency(displayCalc.feeBreakdown.structureDiscount)}
                    </span>
                  </div>
                )}
                <FormField label="Extra discount for this student">
                  <Input
                    type="number"
                    min={0}
                    value={studentDiscount}
                    onChange={(e) => {
                      setStudentDiscount(e.target.value);
                      setSelectedQuarter(null);
                    }}
                    placeholder="0"
                  />
                </FormField>
                <p className="text-xs text-muted-foreground">
                  Saved automatically when you submit payment. Pending due updates as you type.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {!displayCalc && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-3 text-sm text-amber-800 dark:text-amber-200">
                  No fee structure exists for this class and session. Create one in Fee Structure first.
                </div>
              )}
              <FormField label="Payment Amount" required>
                <Input
                  type="number"
                  min={1}
                  max={maxPayable}
                  value={paymentAmount}
                  onChange={(e) => { setPaymentAmount(e.target.value); setSelectedQuarter(null); }}
                  placeholder={selectedQuarter ? `Quarter ${selectedQuarter} due` : `Max: ${formatCurrency(maxPayable)}`}
                />
              </FormField>
              {selectedQuarter && (
                <p className="text-xs text-primary -mt-2">Collecting for Quarter {selectedQuarter}</p>
              )}
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
              <Button className="w-full" onClick={handleCollect} disabled={submitting || !maxPayable || savingTransport}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Payment
              </Button>
            </CardContent>
          </Card>

          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="h-4 w-4" />
                  Previous Fee Slips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  All past payments — tap Print Slip to reprint or share with parent.
                </p>
                {payments.map((p) => {
                  const customLabel = p.customSessionName as string | undefined;
                  const slipSession = p.sessionId as { name?: string } | string | undefined;
                  const sessionLabel =
                    customLabel ||
                    (typeof slipSession === "object" && slipSession?.name ? slipSession.name : null);
                  return (
                    <div
                      key={p._id as string}
                      className="flex justify-between items-center gap-2 p-3 rounded-lg border bg-muted/50 text-sm hover:bg-muted transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium font-mono truncate">{p.receiptNumber as string}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(p.paymentDate as string)}
                          {sessionLabel ? ` · ${sessionLabel}` : ""}
                          {p.quarter ? ` · Q${p.quarter}` : ""}
                          {" · "}{(p.paymentMode as string).replace("_", " ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="font-bold tabular-nums">{formatCurrency(p.currentPayment as number)}</p>
                          <Badge variant={p.paymentStatus === "paid" ? "success" : "warning"} className="text-xs">
                            {p.paymentStatus as string}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => router.push(`/receipt/${p._id as string}`)}
                        >
                          <Receipt className="h-3.5 w-3.5 mr-1" />
                          Print Slip
                        </Button>
                      </div>
                    </div>
                  );
                })}
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
