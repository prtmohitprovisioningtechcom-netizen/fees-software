"use client";

import { useEffect, useState } from "react";
import { Users, IndianRupee, AlertCircle, TrendingUp, Receipt } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { dashboardApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DashboardStats } from "@/types";
import Link from "next/link";

export default function DashboardPage() {
  const { isSuperAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getStats()
      .then((res) => setStats((res as { data: DashboardStats }).data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <PageHeader
        title="Dashboard"
        description={`Welcome back! Here's your ${isSuperAdmin ? "overview" : "daily summary"}.`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Total Students" value={stats?.totalStudents ?? 0} icon={Users} loading={loading} />
        {isSuperAdmin && (
          <StatCard
            title="Total Fee Collected"
            value={stats?.totalFeeCollected ?? 0}
            icon={IndianRupee}
            loading={loading}
            variant="success"
          />
        )}
        <StatCard
          title="Pending Fees"
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
                  <TableHead>Class</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentPayments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell className="font-medium">{payment.receiptNumber}</TableCell>
                    <TableCell>{payment.studentName}</TableCell>
                    <TableCell>{payment.className}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.paymentStatus === "paid"
                            ? "success"
                            : payment.paymentStatus === "partial"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {payment.paymentStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No recent payments</p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
