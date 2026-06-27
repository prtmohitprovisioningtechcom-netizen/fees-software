"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { dashboardApi, classesApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export default function ReportsPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", classId: "" });

  useEffect(() => { if (!isSuperAdmin) router.push("/dashboard"); }, [isSuperAdmin, router]);

  useEffect(() => {
    classesApi.getAll().then((res) => setClasses((res as { data: typeof classes }).data));
  }, []);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.classId) params.classId = filters.classId;

    dashboardApi.getReports(params).then((res) => {
      const data = (res as { data: { payments: Record<string, unknown>[]; summary: Record<string, unknown> } }).data;
      setPayments(data.payments);
      setSummary(data.summary);
    });
  }, [filters]);

  return (
    <DashboardLayout>
      <PageHeader title="Fee Collection Reports" description="View all fee collection data" breadcrumbs={[{ label: "Reports" }]} />

      <Card className="mb-6">
        <CardContent className="pt-6 grid gap-4 md:grid-cols-3">
          <FormField label="Start Date"><Input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} /></FormField>
          <FormField label="End Date"><Input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} /></FormField>
          <FormField label="Class">
            <Select value={filters.classId} onValueChange={(v) => setFilters({ ...filters, classId: v === "all" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card><CardHeader><CardTitle className="text-sm">Total Collections</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{summary.totalCollections as number || 0}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Total Amount</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-primary">{formatCurrency((summary.totalAmount as number) || 0)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">By Payment Mode</CardTitle></CardHeader><CardContent className="text-sm space-y-1">
          {Object.entries((summary.byMode as Record<string, number>) || {}).map(([mode, amount]) => (
            <div key={mode} className="flex justify-between capitalize"><span>{mode.replace("_", " ")}</span><strong>{formatCurrency(amount)}</strong></div>
          ))}
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Collected By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => {
                const student = p.studentId as Record<string, unknown>;
                const cls = student?.classId as { name: string };
                const collectedBy = p.collectedBy as { name: string };
                return (
                  <TableRow key={p._id as string}>
                    <TableCell className="font-medium">{p.receiptNumber as string}</TableCell>
                    <TableCell>{student?.studentName as string}</TableCell>
                    <TableCell>{cls?.name}</TableCell>
                    <TableCell>{formatCurrency(p.currentPayment as number)}</TableCell>
                    <TableCell className="capitalize">{(p.paymentMode as string).replace("_", " ")}</TableCell>
                    <TableCell>{formatDate(p.paymentDate as string)}</TableCell>
                    <TableCell>{collectedBy?.name}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
