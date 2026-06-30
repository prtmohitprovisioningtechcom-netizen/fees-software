"use client";

import { useEffect, useState, useMemo } from "react";
import { Download, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { dashboardApi, classesApi, sessionsApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";

interface Collector {
  _id: string;
  name: string;
  role: string;
}

export default function ReportsPage() {
  const { isSuperAdmin, user } = useAuth();
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);
  const [sessions, setSessions] = useState<{ _id: string; name: string }[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    classId: "",
    sessionId: "",
    collectedBy: "",
  });

  const buildParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.classId) params.classId = filters.classId;
    if (filters.sessionId) params.sessionId = filters.sessionId;
    if (isSuperAdmin && filters.collectedBy) params.collectedBy = filters.collectedBy;
    return params;
  }, [filters, isSuperAdmin]);

  useEffect(() => {
    classesApi.getAll().then((res) => setClasses((res as { data: typeof classes }).data));
    sessionsApi.getAll().then((res) => setSessions((res as { data: typeof sessions }).data));
    if (isSuperAdmin) {
      dashboardApi.getReportCollectors().then((res) => setCollectors((res as { data: Collector[] }).data));
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    setLoading(true);
    dashboardApi
      .getReports(buildParams)
      .then((res) => {
        const data = (res as { data: { payments: Record<string, unknown>[]; summary: Record<string, unknown> } }).data;
        setPayments(data.payments);
        setSummary(data.summary);
      })
      .finally(() => setLoading(false));
  }, [buildParams]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await dashboardApi.downloadReportsExcel(buildParams);
      toast({ title: "Downloaded", description: "Excel report saved successfully" });
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

  const reportTitle = isSuperAdmin ? "Fee Collection Reports" : "My Collection Report";
  const reportDescription = isSuperAdmin
    ? "View all admin collections — filter by admin to see an individual report."
    : `Your fee collections only — ${user?.name || "Admin"}`;

  return (
    <DashboardLayout>
      <PageHeader
        title={reportTitle}
        description={reportDescription}
        breadcrumbs={[{ label: isSuperAdmin ? "Reports" : "My Reports" }]}
        action={
          <Button onClick={handleDownload} disabled={downloading || loading}>
            {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download Excel
          </Button>
        }
      />

      {!isSuperAdmin && (
        <p className="text-sm text-muted-foreground mb-4 -mt-2">
          Showing collections recorded by <strong>{user?.name}</strong> only.
        </p>
      )}

      <Card className="mb-6">
        <CardContent className="pt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <FormField label="Start Date">
            <Input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
          </FormField>
          <FormField label="End Date">
            <Input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
          </FormField>
          <FormField label="Session">
            <Select value={filters.sessionId} onValueChange={(v) => setFilters({ ...filters, sessionId: v === "all" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="All Sessions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Class">
            <Select value={filters.classId} onValueChange={(v) => setFilters({ ...filters, classId: v === "all" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          {isSuperAdmin && (
            <FormField label="Collected By (Admin)">
              <Select value={filters.collectedBy} onValueChange={(v) => setFilters({ ...filters, collectedBy: v === "all" ? "" : v })}>
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
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Total Collections</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary.totalCollections as number || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Total Amount</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-primary">{formatCurrency((summary.totalAmount as number) || 0)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Collected By</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{(summary.collectedByName as string) || (isSuperAdmin ? "All" : user?.name)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">By Payment Mode</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            {Object.entries((summary.byMode as Record<string, number>) || {}).map(([mode, amount]) => (
              <div key={mode} className="flex justify-between capitalize">
                <span>{mode.replace("_", " ")}</span>
                <strong>{formatCurrency(amount)}</strong>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Reg / Adm No</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                {isSuperAdmin && <TableHead>Collected By</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 12 : 11} className="text-center py-10 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 12 : 11} className="text-center py-10 text-muted-foreground">
                    {isSuperAdmin ? "No collections found" : "You have not collected any fees yet"}
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => {
                  const student = p.studentId as Record<string, unknown>;
                  const cls = student?.classId as { name: string };
                  const sec = student?.sectionId as { name: string };
                  const session = p.sessionId as { name: string };
                  const collectedBy = p.collectedBy as { name: string };
                  return (
                    <TableRow key={p._id as string}>
                      <TableCell className="font-medium">{p.receiptNumber as string}</TableCell>
                      <TableCell>{session?.name || "—"}</TableCell>
                      <TableCell>{student?.studentName as string}</TableCell>
                      <TableCell className="text-xs">
                        <div>{student?.registrationNumber as string}</div>
                        <div className="text-muted-foreground">{student?.admissionNumber as string}</div>
                      </TableCell>
                      <TableCell>{cls?.name}</TableCell>
                      <TableCell>{sec?.name}</TableCell>
                      <TableCell>{formatCurrency(p.currentPayment as number)}</TableCell>
                      <TableCell>{formatCurrency(p.balance as number)}</TableCell>
                      <TableCell className="capitalize">{(p.paymentMode as string).replace("_", " ")}</TableCell>
                      <TableCell className="capitalize">{p.paymentStatus as string}</TableCell>
                      <TableCell>{formatDate(p.paymentDate as string)}</TableCell>
                      {isSuperAdmin && <TableCell>{collectedBy?.name}</TableCell>}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
