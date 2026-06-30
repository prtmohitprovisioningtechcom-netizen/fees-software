"use client";

import { useEffect, useState, useRef } from "react";
import { Users, IndianRupee, AlertCircle, TrendingUp, Receipt } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dashboardApi, sessionsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DashboardStats } from "@/types";
import Link from "next/link";

interface Session {
  _id: string;
  name: string;
  isCurrent?: boolean;
}

export default function DashboardPage() {
  const { isSuperAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(true);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      sessionsApi.getAll(),
      dashboardApi.getStats(),
    ])
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

  const selectedSessionName = stats?.session?.name || sessions.find((s) => s._id === sessionId)?.name;

  return (
    <DashboardLayout>
      <PageHeader
        title="Dashboard"
        description={`Welcome back! Here's your ${isSuperAdmin ? "overview" : "daily summary"}.`}
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

      {selectedSessionName && (
        <p className="text-sm text-muted-foreground mb-4">
          Showing data for session: <strong>{selectedSessionName}</strong>
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
          title="Pending Fees (Session)"
          value={stats?.pendingFees ?? 0}
          icon={AlertCircle}
          loading={loading}
          variant="warning"
        />
        <StatCard
          title="Today's Collection"
          value={stats?.todayCollection ?? 0}
          icon={TrendingUp}
          loading={loading}
          variant="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Pending Fees — Top Students
            </CardTitle>
            <Link href={`/fee-collection${sessionId ? `?sessionId=${sessionId}` : ""}`} className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : stats?.pendingStudents?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.pendingStudents.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.studentName}</p>
                          <p className="text-xs text-muted-foreground">{student.registrationNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>{student.className}</TableCell>
                      <TableCell className="text-emerald-600">{formatCurrency(student.paidAmount)}</TableCell>
                      <TableCell className="text-amber-600 font-medium">{formatCurrency(student.pendingAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No pending fees for this session</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Recent Payments
            </CardTitle>
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
                      <TableCell className="font-medium">{payment.receiptNumber}</TableCell>
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
      </div>
    </DashboardLayout>
  );
}
