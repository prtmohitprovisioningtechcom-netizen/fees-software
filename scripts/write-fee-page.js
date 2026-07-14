const fs = require('fs');
const path = require('path');

const feeCollectionPage = `"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { feePaymentsApi, classesApi, sectionsApi, sessionsApi, studentsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { StudentFeeOverview } from "@/types";
import { IndianRupee, Users, Percent, TrendingUp, AlertCircle, CheckCircle2, Bus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Session {
  _id: string;
  name: string;
  isCurrent?: boolean;
}

type TransportStudent = StudentFeeOverview & {
  transportRequired?: boolean;
  transportRouteId?: { name?: string };
};

function SkeletonRow() {
  return (
    <TableRow className="animate-pulse">
      {[60, 140, 60, 60, 80, 70, 70, 70, 70, 70, 90].map((w, i) => (
        <TableCell key={i}>
          <div className="h-4 bg-muted rounded" style={{ width: w }} />
        </TableCell>
      ))}
    </TableRow>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  colorClass: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
      <div className={\`rounded-lg p-2 \${colorClass}\`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function FeeCollectionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<TransportStudent[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [sessionId, setSessionId] = useState(searchParams?.get("sessionId") || "");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionName, setSessionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);
  const [sections, setSections] = useState<{ _id: string; name: string }[]>([]);
  const [discountStudent, setDiscountStudent] = useState<TransportStudent | null>(null);
  const [discountValue, setDiscountValue] = useState("");
  const [savingDiscount, setSavingDiscount] = useState(false);
  const prevDataRef = useRef<TransportStudent[]>([]);
  const [pageSummary, setPageSummary] = useState({ paid: 0, pending: 0 });
  const limit = 20;

  useEffect(() => {
    sessionsApi.getAll().then((res) => {
      const list = (res as { data: Session[] }).data || [];
      setSessions(list);
      if (!sessionId) {
        const current = list.find((s) => s.isCurrent) || list[0];
        if (current) setSessionId(current._id);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStudents = useCallback(async () => {
    if (!sessionId) {
      setStudents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
        sessionId,
      };
      if (classFilter) params.classId = classFilter;
      if (sectionFilter) params.sectionId = sectionFilter;
      if (search.trim()) params.search = search.trim();

      const res = (await feePaymentsApi.getStudentsOverview(params)) as {
        data: TransportStudent[];
        session: { _id: string; name: string };
        pagination: { total: number; totalPages: number };
      };
      prevDataRef.current = res.data;
      setStudents(res.data);
      setSessionName(res.session?.name || "");
      setPagination(res.pagination);
      setPageSummary({
        paid: res.data.reduce((s, x) => s + (x.paidAmount || 0), 0),
        pending: res.data.reduce((s, x) => s + (x.pendingAmount || 0), 0),
      });
    } catch (error) {
      if (prevDataRef.current.length) setStudents(prevDataRef.current);
      toast({
        title: "Could not load students",
        description: error instanceof Error ? error.message : "Failed to load fee collection list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, classFilter, sectionFilter, search, sessionId]);

  useEffect(() => {
    classesApi.getAll().then((res) => setClasses((res as { data: typeof classes }).data));
  }, []);

  useEffect(() => {
    if (classFilter) {
      sectionsApi.getAll(classFilter).then((res) => setSections((res as { data: typeof sections }).data));
    } else {
      setSections([]);
      setSectionFilter("");
    }
  }, [classFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchStudents, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const statusBadge = (status: string) => {
    if (status === "paid")
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" /> Paid
        </Badge>
      );
    if (status === "partial") return <Badge variant="warning">Partial</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const openDiscountDialog = (student: TransportStudent) => {
    setDiscountStudent(student);
    setDiscountValue(String(student.feeDiscount || 0));
  };

  const saveDiscount = async () => {
    if (!discountStudent) return;
    setSavingDiscount(true);
    try {
      await studentsApi.updateFeeDiscount(discountStudent._id, Number(discountValue) || 0);
      toast({ title: "Saved", description: "Student discount updated" });
      setDiscountStudent(null);
      fetchStudents();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally {
      setSavingDiscount(false);
    }
  };

  const displayStudents = loading && prevDataRef.current.length > 0 ? prevDataRef.current : students;
  const showSkeleton = loading && prevDataRef.current.length === 0;

  return (
    <DashboardLayout>
      <PageHeader
        title="Fee Collection"
        description="View paid and pending fees by session, then collect payments."
        breadcrumbs={[{ label: "Fee Collection" }]}
      />

      <Card className="mb-5 shadow-sm">
        <CardContent className="pt-5 pb-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Select value={sessionId} onValueChange={(v) => { setSessionId(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Select Session / Year" /></SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}{s.isCurrent ? " \u2713 Current" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SearchInput value={search} onChange={handleSearchChange} placeholder="Search name, reg no, mobile..." />
            <Select value={classFilter} onValueChange={(v) => { setClassFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sectionFilter} onValueChange={(v) => { setSectionFilter(v === "all" ? "" : v); setPage(1); }} disabled={!classFilter}>
              <SelectTrigger><SelectValue placeholder="All Sections" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {!loading && sessions.length === 0 && (
            <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              No academic session found. Create one from <strong>Sessions</strong> first.
            </p>
          )}
          {sessionName && sessions.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {pagination.total} student{pagination.total !== 1 ? "s" : ""} \u2014 Session: <strong>{sessionName}</strong>
              {loading && <span className="ml-2 text-primary animate-pulse">Updating\u2026</span>}
            </p>
          )}
        </CardContent>
      </Card>

      {!showSkeleton && pagination.total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <SummaryCard icon={Users} label="Total Students (session)" value={\`\${pagination.total}\`} colorClass="bg-primary" />
          <SummaryCard icon={TrendingUp} label="Collected (this page)" value={formatCurrency(pageSummary.paid)} colorClass="bg-emerald-500" />
          <SummaryCard icon={AlertCircle} label="Pending (this page)" value={formatCurrency(pageSummary.pending)} colorClass="bg-amber-500" />
        </div>
      )}

      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="whitespace-nowrap">Reg. No.</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1">
                      <Bus className="h-3.5 w-3.5" /> Transport
                    </span>
                  </TableHead>
                  <TableHead className="text-right">Net Fee</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right text-emerald-700">Paid</TableHead>
                  <TableHead className="text-right text-amber-700">Pending</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showSkeleton ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : displayStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                      {sessions.length === 0
                        ? "Create an academic session first (Sessions menu)"
                        : search.trim()
                          ? "No matching students found"
                          : "No students registered yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayStudents.map((s) => (
                    <TableRow key={s._id} className={loading ? "opacity-60 transition-opacity" : ""}>
                      <TableCell className="font-mono text-xs font-medium">{s.registrationNumber}</TableCell>
                      <TableCell className="font-medium">{s.studentName}</TableCell>
                      <TableCell>{s.classId?.name}</TableCell>
                      <TableCell>{s.sectionId?.name}</TableCell>
                      <TableCell>
                        {s.transportRequired ? (
                          <Badge variant="outline" className="text-xs gap-1 border-blue-300 text-blue-700 bg-blue-50">
                            <Bus className="h-3 w-3" />
                            {s.transportRouteId?.name || "Yes"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">\u2014</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {s.hasFeeStructure ? formatCurrency(s.totalFee) : "\u2014"}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.hasFeeStructure ? (
                          <button
                            type="button"
                            className="text-emerald-600 hover:underline text-sm tabular-nums"
                            onClick={() => openDiscountDialog(s)}
                            title="Set student discount"
                          >
                            {formatCurrency(s.totalDiscount)}
                            {s.feeDiscount > 0 && (
                              <span className="block text-[10px] text-muted-foreground">+{formatCurrency(s.feeDiscount)} student</span>
                            )}
                          </button>
                        ) : "\u2014"}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 tabular-nums font-medium">
                        {s.hasFeeStructure ? formatCurrency(s.paidAmount) : "\u2014"}
                      </TableCell>
                      <TableCell className="text-right text-amber-600 tabular-nums font-semibold">
                        {s.hasFeeStructure ? formatCurrency(s.pendingAmount) : "\u2014"}
                      </TableCell>
                      <TableCell>
                        {s.hasFeeStructure ? statusBadge(s.paymentStatus) : (
                          <Badge variant="outline" className="text-xs">No Structure</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-emerald-600"
                            onClick={() => openDiscountDialog(s)}
                            title="Student discount"
                          >
                            <Percent className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="gap-1"
                            onClick={() => router.push(\`/fee-collection/\${s._id}?sessionId=\${sessionId}\`)}
                          >
                            <IndianRupee className="h-3.5 w-3.5" /> Collect
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {!showSkeleton && displayStudents.length > 0 && (
            <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!discountStudent} onOpenChange={(open) => !open && setDiscountStudent(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Student Discount</DialogTitle></DialogHeader>
          {discountStudent && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <strong>{discountStudent.studentName}</strong> \u2014 Extra discount (\u20b9) on top of class default discount.
              </p>
              <div className="text-sm space-y-1 rounded-lg bg-muted p-3">
                <div className="flex justify-between">
                  <span>Gross Fee</span>
                  <span>{formatCurrency(discountStudent.grossTotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Total Discount (after save)</span>
                  <span>{formatCurrency(Math.min(discountStudent.grossTotal, (discountStudent.totalDiscount - discountStudent.feeDiscount) + (Number(discountValue) || 0)))}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                  <span>Net After Discount</span>
                  <span className="text-primary">{formatCurrency(Math.max(0, discountStudent.grossTotal - Math.min(discountStudent.grossTotal, (discountStudent.totalDiscount - discountStudent.feeDiscount) + (Number(discountValue) || 0))))}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Student Discount (\u20b9)</label>
                <Input type="number" min={0} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="mt-1" autoFocus />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDiscountStudent(null)}>Cancel</Button>
                <Button onClick={saveDiscount} disabled={savingDiscount}>{savingDiscount ? "Saving..." : "Save Discount"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function FeeCollectionFallback() {
  return (
    <DashboardLayout>
      <div className="text-center py-12 text-muted-foreground">Loading fee collection...</div>
    </DashboardLayout>
  );
}

export default function FeeCollectionPage() {
  return (
    <Suspense fallback={<FeeCollectionFallback />}>
      <FeeCollectionPageContent />
    </Suspense>
  );
}
`;

fs.writeFileSync(path.join(__dirname, '../src/app/fee-collection/page.tsx'), feeCollectionPage, 'utf8');
console.log('fee-collection/page.tsx written OK');
