"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  IndianRupee,
  TrendingUp,
  Receipt,
  CalendarRange,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { dashboardApi, sessionsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { DashboardStats } from "@/types";
import { QUARTER_LABELS, type QuarterNumber } from "@/lib/fee-schedule";
import Link from "next/link";

interface Session {
  _id: string;
  name: string;
  isCurrent?: boolean;
}

type QuarterStudentRow = {
  _id: string;
  studentName: string;
  registrationNumber: string;
  className: string;
  sectionName: string;
  totalDue: number;
  paid: number;
  pending: number;
  status: "paid" | "partial" | "pending";
};

type QuarterDetailsData = {
  session: { _id: string; name: string };
  quarter: number;
  label: string;
  summary: {
    due: number;
    collected: number;
    pending: number;
    countPaid: number;
    countPartial: number;
    countPending: number;
    totalStudents: number;
  };
  students: QuarterStudentRow[];
};

type StatusFilter = "all" | "pending" | "partial" | "paid";

export default function DashboardPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(true);
  const skipNextFetch = useRef(false);

  const [selectedQuarter, setSelectedQuarter] = useState<QuarterNumber | null>(null);
  const [quarterDetails, setQuarterDetails] = useState<QuarterDetailsData | null>(null);
  const [quarterLoading, setQuarterLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([sessionsApi.getAll(), dashboardApi.getStats()])
      .then(([sessionsRes, statsRes]) => {
        if (cancelled) return;
        const list = (sessionsRes as { data: Session[] }).data || [];
        const data = (statsRes as { data: DashboardStats }).data;
        setSessions(list);
        setStats(data);
        if (data.session?._id) {
          skipNextFetch.current = true;
          setSessionId(data.session._id);
        } else {
          const current = list.find((s) => s.isCurrent) || list[0];
          if (current) {
            skipNextFetch.current = true;
            setSessionId(current._id);
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    setLoading(true);
    dashboardApi
      .getStats(sessionId)
      .then((res) => setStats((res as { data: DashboardStats }).data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  const openQuarter = (q: QuarterNumber) => {
    if (!sessionId) return;
    setSelectedQuarter(q);
    setStatusFilter("all");
    setQuarterDetails(null);
    setQuarterLoading(true);
    dashboardApi
      .getQuarterDetails(sessionId, q)
      .then((res) => setQuarterDetails((res as { data: QuarterDetailsData }).data))
      .catch(console.error)
      .finally(() => setQuarterLoading(false));
  };

  const filteredStudents = useMemo(() => {
    const list = quarterDetails?.students || [];
    if (statusFilter === "all") return list;
    return list.filter((s) => s.status === statusFilter);
  }, [quarterDetails, statusFilter]);

  const selectedSessionName = stats?.session?.name || sessions.find((s) => s._id === sessionId)?.name;
  const quarters = [1, 2, 3, 4] as QuarterNumber[];

  const statusBadge = (status: string) => {
    if (status === "paid") return <Badge variant="success">Paid</Badge>;
    if (status === "partial") return <Badge variant="warning">Partial</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Dashboard"
        description={`Welcome back! Here's your ${isSuperAdmin ? "overview" : "daily summary"}.`}
        action={
          <Select value={sessionId || undefined} onValueChange={setSessionId}>
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

      {selectedSessionName && (
        <p className="text-sm text-muted-foreground mb-4">
          Showing data for session: <strong>{selectedSessionName}</strong>
        </p>
      )}

      {(stats as DashboardStats & { needsSession?: boolean })?.needsSession && (
        <Card className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="py-4 text-sm">
            <strong>No academic session found.</strong>{" "}
            <Link href="/sessions" className="text-primary underline font-medium">
              Create a session
            </Link>{" "}
            to view fee collection stats.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard title="Total Students" value={stats?.totalStudents ?? 0} icon={Users} loading={loading} />
        {isSuperAdmin && (
          <StatCard
            title="Fee Collected (Session)"
            value={stats?.totalFeeCollected ?? 0}
            icon={IndianRupee}
            loading={loading}
            variant="success"
          />
        )}
        <StatCard
          title="Today's Collection"
          value={stats?.todayCollection ?? 0}
          icon={TrendingUp}
          loading={loading}
          variant="success"
        />
      </div>

      <Card className="mb-6 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-primary" />
            Quarterly Overview
          </CardTitle>
          <p className="text-xs text-muted-foreground font-normal">
            Click any quarter to see student-wise due, paid, and balance for that quarter.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quarters.map((q) => {
              const totals = stats?.quarterTotals?.[q];
              const collected = stats?.collectedByQuarter?.[q] ?? totals?.collected ?? 0;
              const due = totals?.due ?? 0;
              const pending = totals?.pending ?? Math.max(0, due - collected);
              const active = selectedQuarter === q;
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => openQuarter(q)}
                  disabled={!sessionId || loading}
                  className={cn(
                    "rounded-xl border bg-card p-4 space-y-2 shadow-sm text-left transition-all",
                    "hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    active && "ring-2 ring-primary border-primary"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{QUARTER_LABELS[q]}</p>
                    <Badge variant={pending <= 0 && due > 0 ? "success" : "secondary"} className="text-[10px]">
                      Q{q}
                    </Badge>
                  </div>
                  {loading ? (
                    <div className="h-16 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Due</span>
                        <span className="tabular-nums font-medium">{formatCurrency(due)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Collected</span>
                        <span className="tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(collected)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2 border-t pt-1">
                        <span className="text-muted-foreground">Pending</span>
                        <span className="tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                          {formatCurrency(pending)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground pt-0.5">
                        {totals?.countPaid ?? 0} paid · {totals?.countPending ?? 0} pending · Tap for details
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Recent Payments
          </CardTitle>
          <Link
            href={`/fee-collection${sessionId ? `?sessionId=${sessionId}` : ""}`}
            className="text-sm text-primary hover:underline"
          >
            Collect fees
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : stats?.recentPayments?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentPayments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell className="font-medium">
                      {payment.receiptNumber}
                      {payment.quarter ? (
                        <Badge variant="outline" className="ml-1.5 text-[10px]">
                          Q{payment.quarter}
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>{payment.studentName}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No recent payments for this session</p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={selectedQuarter != null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedQuarter(null);
            setQuarterDetails(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {quarterDetails?.label || (selectedQuarter ? QUARTER_LABELS[selectedQuarter] : "Quarter")} — Student
              Details
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-normal">
              {selectedSessionName} · Who paid, who is partial, who still has dues
            </p>
          </DialogHeader>

          {quarterLoading || !quarterDetails ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading quarter details…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="rounded-lg border px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Due</p>
                  <p className="font-semibold tabular-nums">{formatCurrency(quarterDetails.summary.due)}</p>
                </div>
                <div className="rounded-lg border px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Collected</p>
                  <p className="font-semibold tabular-nums text-emerald-600">
                    {formatCurrency(quarterDetails.summary.collected)}
                  </p>
                </div>
                <div className="rounded-lg border px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Pending</p>
                  <p className="font-semibold tabular-nums text-amber-600">
                    {formatCurrency(quarterDetails.summary.pending)}
                  </p>
                </div>
                <div className="rounded-lg border px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Students</p>
                  <p className="font-semibold text-xs leading-snug pt-0.5">
                    {quarterDetails.summary.countPaid} paid · {quarterDetails.summary.countPartial} partial ·{" "}
                    {quarterDetails.summary.countPending} pending
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["all", "All"],
                    ["pending", "Pending"],
                    ["partial", "Partial"],
                    ["paid", "Paid"],
                  ] as const
                ).map(([key, label]) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={statusFilter === key ? "default" : "outline"}
                    onClick={() => setStatusFilter(key)}
                  >
                    {label}
                    {key !== "all" && quarterDetails
                      ? ` (${
                          key === "pending"
                            ? quarterDetails.summary.countPending
                            : key === "partial"
                              ? quarterDetails.summary.countPartial
                              : quarterDetails.summary.countPaid
                        })`
                      : ` (${quarterDetails.summary.totalStudents})`}
                  </Button>
                ))}
              </div>

              <div className="overflow-auto flex-1 min-h-0 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                          No students in this filter
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((s) => (
                        <TableRow key={s._id}>
                          <TableCell>
                            <p className="font-medium">{s.studentName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{s.registrationNumber}</p>
                          </TableCell>
                          <TableCell className="text-sm">
                            {s.className}
                            {s.sectionName && s.sectionName !== "—" ? ` / ${s.sectionName}` : ""}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(s.totalDue)}</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600">
                            {formatCurrency(s.paid)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-amber-600">
                            {formatCurrency(s.pending)}
                          </TableCell>
                          <TableCell>{statusBadge(s.status)}</TableCell>
                          <TableCell className="text-right">
                            {s.pending > 0 ? (
                              <Button
                                size="sm"
                                className="gap-1"
                                onClick={() =>
                                  router.push(
                                    `/fee-collection/${s._id}?sessionId=${sessionId}`
                                  )
                                }
                              >
                                <IndianRupee className="h-3.5 w-3.5" /> Collect
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Cleared</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
