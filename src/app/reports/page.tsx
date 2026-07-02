"use client";

import { useEffect, useState, useMemo } from "react";
import { Download, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { Badge } from "@/components/ui/badge";
import { dashboardApi, classesApi, sessionsApi } from "@/lib/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import { QUARTER_LABELS, type QuarterNumber } from "@/lib/fee-schedule";

interface Collector {
  _id: string;
  name: string;
  role: string;
}

interface QuarterTotals {
  due: number;
  collected: number;
  pending: number;
  countPaid: number;
  countPending: number;
}

interface QuarterlyStudent {
  _id: string;
  studentName: string;
  registrationNumber: string;
  className: string;
  sectionName: string;
  quarters: {
    quarter: QuarterNumber;
    totalDue: number;
    paid: number;
    pending: number;
    status: "paid" | "partial" | "pending";
  }[];
  totalDue: number;
  totalPaid: number;
  totalPending: number;
  paymentStatus: string;
}

const QUARTERS: QuarterNumber[] = [1, 2, 3, 4];

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "paid" ? "default" : status === "partial" ? "secondary" : "outline";
  return (
    <Badge variant={variant} className="capitalize text-[10px]">
      {status}
    </Badge>
  );
}

function QuarterCell({ due, paid, pending, status }: { due: number; paid: number; pending: number; status: string }) {
  return (
    <div className="text-xs space-y-0.5 min-w-[90px]">
      <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">Due</span>
        <span className="tabular-nums">{formatCurrency(due)}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">Paid</span>
        <span className="tabular-nums text-emerald-700">{formatCurrency(paid)}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">Bal</span>
        <span className={cn("tabular-nums font-medium", pending > 0 && "text-amber-700")}>
          {formatCurrency(pending)}
        </span>
      </div>
      <StatusBadge status={status} />
    </div>
  );
}

export default function ReportsPage() {
  const { isSuperAdmin, user } = useAuth();
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);
  const [quarterlyStudents, setQuarterlyStudents] = useState<QuarterlyStudent[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);
  const [sessions, setSessions] = useState<{ _id: string; name: string; isCurrent?: boolean }[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"status" | "collections">("status");
  const [filters, setFilters] = useState({
    quarter: "",
    classId: "",
    sessionId: "",
    collectedBy: "",
  });

  const buildParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (filters.quarter) params.quarter = filters.quarter;
    if (filters.classId) params.classId = filters.classId;
    if (filters.sessionId) params.sessionId = filters.sessionId;
    if (isSuperAdmin && filters.collectedBy) params.collectedBy = filters.collectedBy;
    return params;
  }, [filters, isSuperAdmin]);

  useEffect(() => {
    classesApi.getAll().then((res) => setClasses((res as { data: typeof classes }).data));
    sessionsApi.getAll().then((res) => {
      const list = (res as { data: typeof sessions }).data || [];
      setSessions(list);
      if (!filters.sessionId) {
        const current = list.find((s) => s.isCurrent) || list[0];
        if (current) setFilters((f) => ({ ...f, sessionId: current._id }));
      }
    });
    if (isSuperAdmin) {
      dashboardApi.getReportCollectors().then((res) => setCollectors((res as { data: Collector[] }).data));
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!filters.sessionId) return;
    setLoading(true);
    dashboardApi
      .getReports(buildParams)
      .then((res) => {
        const data = (res as {
          data: {
            payments: Record<string, unknown>[];
            summary: Record<string, unknown>;
            quarterlyStudents: QuarterlyStudent[];
          };
        }).data;
        setPayments(data.payments);
        setSummary(data.summary);
        setQuarterlyStudents(data.quarterlyStudents || []);
      })
      .catch((error) => {
        toast({
          title: "Could not load report",
          description: error instanceof Error ? error.message : "Failed to fetch reports",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [buildParams, filters.sessionId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await dashboardApi.downloadReportsExcel(buildParams);
      toast({ title: "Downloaded", description: "Quarterly Excel report saved successfully" });
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Could not export report",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const byQuarter = (summary.byQuarter as Record<number, number>) || {};
  const quarterTotals = (summary.quarterTotals as Record<number, QuarterTotals>) || {};
  const selectedQuarter = filters.quarter ? (Number(filters.quarter) as QuarterNumber) : null;

  const reportTitle = isSuperAdmin ? "Quarterly Fee Reports" : "My Quarterly Report";
  const reportDescription = isSuperAdmin
    ? "Quarter-wise collection and fee status — filter by session, quarter, or class."
    : `Your quarterly collections — ${user?.name || "Admin"}`;

  return (
    <DashboardLayout>
      <PageHeader
        title={reportTitle}
        description={reportDescription}
        breadcrumbs={[{ label: isSuperAdmin ? "Reports" : "My Reports" }]}
        action={
          <Button onClick={handleDownload} disabled={downloading || loading || !filters.sessionId || sessions.length === 0}>
            {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download Excel
          </Button>
        }
      />

      {sessions.length === 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="py-4 text-sm">
            <strong>No academic session found.</strong> Go to Sessions and create one for your school year.
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardContent className="pt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <FormField label="Session">
            <Select
              value={filters.sessionId}
              onValueChange={(v) => setFilters({ ...filters, sessionId: v })}
            >
              <SelectTrigger><SelectValue placeholder="Select Session" /></SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s._id} value={s._id}>{s.name}{s.isCurrent ? " (Current)" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Quarter">
            <Select value={filters.quarter || "all"} onValueChange={(v) => setFilters({ ...filters, quarter: v === "all" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="All Quarters" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quarters</SelectItem>
                {QUARTERS.map((q) => (
                  <SelectItem key={q} value={String(q)}>{QUARTER_LABELS[q]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Class">
            <Select value={filters.classId || "all"} onValueChange={(v) => setFilters({ ...filters, classId: v === "all" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          {isSuperAdmin && (
            <FormField label="Collected By (Admin)">
              <Select value={filters.collectedBy || "all"} onValueChange={(v) => setFilters({ ...filters, collectedBy: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="All Admins" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Admins</SelectItem>
                  {collectors.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name} {c.role === "super_admin" ? "(Super Admin)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
          <FormField label="Session Total">
            <div className="h-10 flex items-center">
              <span className="text-lg font-bold text-primary">{formatCurrency((summary.totalAmount as number) || 0)}</span>
              <span className="text-xs text-muted-foreground ml-2">collected</span>
            </div>
          </FormField>
        </CardContent>
      </Card>

      {/* Quarterly summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {QUARTERS.map((q) => {
          const totals = quarterTotals[q] || { due: 0, collected: 0, pending: 0, countPaid: 0, countPending: 0 };
          const filteredCollected = selectedQuarter === q ? (summary.totalAmount as number) || 0 : byQuarter[q] || 0;
          const isSelected = selectedQuarter === q;
          return (
            <Card
              key={q}
              className={cn(
                "cursor-pointer transition-colors hover:border-primary/50",
                isSelected && "border-primary ring-1 ring-primary/30"
              )}
              onClick={() => setFilters((f) => ({ ...f, quarter: isSelected ? "" : String(q) }))}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{QUARTER_LABELS[q]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Collected</span>
                  <strong className="text-primary tabular-nums">{formatCurrency(filteredCollected)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Due</span>
                  <span className="tabular-nums">{formatCurrency(totals.due)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending</span>
                  <span className={cn("tabular-nums font-medium", totals.pending > 0 && "text-amber-700")}>
                    {formatCurrency(totals.pending)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t">
                  <span>{totals.countPaid} paid</span>
                  <span>{totals.countPending} pending</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          variant={activeTab === "status" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("status")}
        >
          Quarterly Fee Status
        </Button>
        <Button
          variant={activeTab === "collections" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("collections")}
        >
          Collections ({payments.length})
        </Button>
      </div>

      {activeTab === "status" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Student-wise Quarterly Breakdown</CardTitle>
              <p className="text-sm text-muted-foreground">
                Due, paid, and balance for each quarter — session {(summary.sessionName as string) || ""}
              </p>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10">Student</TableHead>
                    <TableHead>Class</TableHead>
                    {QUARTERS.map((q) => (
                      <TableHead key={q} className="text-center min-w-[100px]">
                        Q{q}
                      </TableHead>
                    ))}
                    <TableHead>Total Pending</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Loading...</TableCell>
                    </TableRow>
                  ) : quarterlyStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        No students with fee structure found
                      </TableCell>
                    </TableRow>
                  ) : (
                    quarterlyStudents.map((s) => {
                      if (selectedQuarter) {
                        const qData = s.quarters.find((q) => q.quarter === selectedQuarter);
                        if (!qData || qData.status === "paid") return null;
                      }
                      return (
                        <TableRow key={s._id}>
                          <TableCell className="sticky left-0 bg-background z-10">
                            <div className="font-medium">{s.studentName}</div>
                            <div className="text-xs text-muted-foreground">{s.registrationNumber}</div>
                          </TableCell>
                          <TableCell className="text-sm">{s.className}-{s.sectionName}</TableCell>
                          {QUARTERS.map((q) => {
                            const qData = s.quarters.find((x) => x.quarter === q);
                            return (
                              <TableCell key={q} className={cn(selectedQuarter === q && "bg-primary/5")}>
                                {qData ? (
                                  <QuarterCell
                                    due={qData.totalDue}
                                    paid={qData.paid}
                                    pending={qData.pending}
                                    status={qData.status}
                                  />
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="font-semibold tabular-nums text-amber-700">
                            {formatCurrency(s.totalPending)}
                          </TableCell>
                          <TableCell><StatusBadge status={s.paymentStatus} /></TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
      )}

      {activeTab === "collections" && (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Quarter</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Reg No</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Date</TableHead>
                    {isSuperAdmin && <TableHead>Collected By</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={isSuperAdmin ? 10 : 9} className="text-center py-10 text-muted-foreground">Loading...</TableCell>
                    </TableRow>
                  ) : payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isSuperAdmin ? 10 : 9} className="text-center py-10 text-muted-foreground">
                        {isSuperAdmin ? "No collections found for selected filters" : "You have not collected any fees yet"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((p) => {
                      const student = p.studentId as Record<string, unknown>;
                      const cls = student?.classId as { name: string };
                      const sec = student?.sectionId as { name: string };
                      const collectedBy = p.collectedBy as { name: string };
                      const quarter = p.quarter as number | undefined;
                      return (
                        <TableRow key={p._id as string}>
                          <TableCell className="font-medium">{p.receiptNumber as string}</TableCell>
                          <TableCell>
                            {quarter && quarter >= 1 && quarter <= 4 ? (
                              <Badge variant="outline" className="text-[10px]">Q{quarter}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{student?.studentName as string}</TableCell>
                          <TableCell className="text-xs">{student?.registrationNumber as string}</TableCell>
                          <TableCell>{cls?.name}-{sec?.name}</TableCell>
                          <TableCell className="font-semibold text-primary">{formatCurrency(p.currentPayment as number)}</TableCell>
                          <TableCell>{formatCurrency(p.balance as number)}</TableCell>
                          <TableCell className="capitalize text-xs">{(p.paymentMode as string).replace("_", " ")}</TableCell>
                          <TableCell className="text-xs">{formatDate(p.paymentDate as string)}</TableCell>
                          {isSuperAdmin && <TableCell className="text-xs">{collectedBy?.name}</TableCell>}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
      )}
    </DashboardLayout>
  );
}
