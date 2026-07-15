"use client";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { feePaymentsApi, classesApi, sectionsApi, sessionsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { StudentFeeOverview } from "@/types";
import { IndianRupee, Users, TrendingUp, AlertCircle, CheckCircle2, Bus, Pencil } from "lucide-react";
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
      {[60, 140, 60, 60, 80, 70, 70, 70, 70, 90].map((w, i) => (
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
      <div className={`rounded-lg p-2 ${colorClass}`}>
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
  const prevDataRef = useRef<TransportStudent[]>([]);
  const [pageSummary, setPageSummary] = useState({ paid: 0, pending: 0 });
  const limit = 20;

  useEffect(() => {
    Promise.all([sessionsApi.getAll(), classesApi.getAll()]).then(([sessionsRes, classesRes]) => {
      const list = (sessionsRes as { data: Session[] }).data || [];
      setSessions(list);
      setClasses((classesRes as { data: typeof classes }).data);
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
    const isFirst = prevDataRef.current.length === 0;
    if (isFirst) setLoading(true);
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
    if (!classFilter) {
      setSections([]);
      setSectionFilter("");
      return;
    }
    sectionsApi
      .getAll(classFilter)
      .then((res) => setSections((res as { data: typeof sections }).data || []))
      .catch(() => {
        setSections([]);
        setSectionFilter("");
      });
  }, [classFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchStudents, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleClassChange = (value: string) => {
    const next = value === "all" ? "" : value;
    setClassFilter(next);
    setSectionFilter("");
    setPage(1);
  };

  const handleSectionChange = (value: string) => {
    setSectionFilter(value === "all" ? "" : value);
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

  const displayStudents = loading && prevDataRef.current.length > 0 ? prevDataRef.current : students;
  const showSkeleton = loading && prevDataRef.current.length === 0;

  return (
    <DashboardLayout>
      <PageHeader
        title="Fee Collection"
        description="Collect fees by session. Edit student or set transport/discount on collect page."
        breadcrumbs={[{ label: "Fee Collection" }]}
      />

      <Card className="mb-5 shadow-sm">
        <CardContent className="pt-5 pb-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Select
              value={sessionId || undefined}
              onValueChange={(v) => {
                setSessionId(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Session / Year" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}
                    {s.isCurrent ? " ✓ Current" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SearchInput value={search} onChange={handleSearchChange} placeholder="Search name, reg no, mobile..." />
            <Select value={classFilter || "all"} onValueChange={handleClassChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sectionFilter || "all"}
              onValueChange={handleSectionChange}
              disabled={!classFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!loading && sessions.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              No academic session found. Create one from Sessions first.
            </p>
          )}
          {sessionName && sessions.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {pagination.total} student{pagination.total !== 1 ? "s" : ""} — Session: <strong>{sessionName}</strong>
              {loading && <span className="ml-2 text-primary animate-pulse">Updating…</span>}
            </p>
          )}
        </CardContent>
      </Card>

      {!showSkeleton && pagination.total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <SummaryCard icon={Users} label="Total Students (session)" value={`${pagination.total}`} colorClass="bg-primary" />
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
                  <TableHead className="text-right text-emerald-700 dark:text-emerald-400">Paid</TableHead>
                  <TableHead className="text-right text-amber-700 dark:text-amber-400">Pending</TableHead>
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
                        : search.trim() || classFilter || sectionFilter
                          ? "No students match these filters"
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
                          <Badge variant="outline" className="text-xs gap-1 border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950/40">
                            <Bus className="h-3 w-3" />
                            {s.transportRouteId?.name || "Yes"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {s.hasFeeStructure ? formatCurrency(s.totalFee) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {s.hasFeeStructure ? formatCurrency(s.totalDiscount) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 dark:text-emerald-400 tabular-nums font-medium">
                        {s.hasFeeStructure ? formatCurrency(s.paidAmount) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-amber-600 dark:text-amber-400 tabular-nums font-semibold">
                        {s.hasFeeStructure ? formatCurrency(s.pendingAmount) : "—"}
                      </TableCell>
                      <TableCell>
                        {s.hasFeeStructure ? statusBadge(s.paymentStatus) : (
                          <Badge variant="outline" className="text-xs">No Structure</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => router.push(`/students/${s._id}/edit`)}
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            className="gap-1"
                            onClick={() => router.push(`/fee-collection/${s._id}?sessionId=${sessionId}`)}
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
