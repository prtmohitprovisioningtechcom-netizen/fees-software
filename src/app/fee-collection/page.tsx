"use client";

import { useEffect, useState, useCallback } from "react";
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
import { IndianRupee, Users, Percent } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Session {
  _id: string;
  name: string;
  isCurrent?: boolean;
}

export default function FeeCollectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<StudentFeeOverview[]>([]);
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
  const [discountStudent, setDiscountStudent] = useState<StudentFeeOverview | null>(null);
  const [discountValue, setDiscountValue] = useState("");
  const [savingDiscount, setSavingDiscount] = useState(false);

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
  }, [sessionId]);

  const fetchStudents = useCallback(async () => {
    if (!sessionId) return;
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
        data: StudentFeeOverview[];
        session: { _id: string; name: string };
        pagination: { total: number; totalPages: number };
      };
      setStudents(res.data);
      setSessionName(res.session?.name || "");
      setPagination(res.pagination);
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
    const timer = setTimeout(fetchStudents, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const statusBadge = (status: string) => {
    if (status === "paid") return <Badge variant="success">Paid</Badge>;
    if (status === "partial") return <Badge variant="warning">Partial</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const openDiscountDialog = (student: StudentFeeOverview) => {
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

  return (
    <DashboardLayout>
      <PageHeader
        title="Fee Collection"
        description="Session-wise fee status — paid aur pending amount dekhein, phir fee collect karein."
        breadcrumbs={[{ label: "Fee Collection" }]}
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Select value={sessionId} onValueChange={(v) => { setSessionId(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select Session / Year" />
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
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Search name, reg no, mobile..."
            />
            <Select
              value={classFilter}
              onValueChange={(v) => {
                setClassFilter(v === "all" ? "" : v);
                setPage(1);
              }}
            >
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
              value={sectionFilter}
              onValueChange={(v) => {
                setSectionFilter(v === "all" ? "" : v);
                setPage(1);
              }}
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
          {!loading && sessionName && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {pagination.total} student{pagination.total !== 1 ? "s" : ""} — Session: <strong>{sessionName}</strong>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Reg. No.</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead className="text-right">Net Fee</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                    Loading students...
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                    {search.trim() ? "No matching students found" : "No students registered yet"}
                  </TableCell>
                </TableRow>
              ) : (
                students.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell className="font-medium">{s.registrationNumber}</TableCell>
                    <TableCell>{s.studentName}</TableCell>
                    <TableCell>{s.classId?.name}</TableCell>
                    <TableCell>{s.sectionId?.name}</TableCell>
                    <TableCell className="text-right">
                      {s.hasFeeStructure ? formatCurrency(s.totalFee) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.hasFeeStructure ? (
                        <button
                          type="button"
                          className="text-emerald-600 hover:underline text-sm"
                          onClick={() => openDiscountDialog(s)}
                          title="Set student discount"
                        >
                          {formatCurrency(s.totalDiscount)}
                          {s.feeDiscount > 0 && (
                            <span className="block text-[10px] text-muted-foreground">
                              +{formatCurrency(s.feeDiscount)} student
                            </span>
                          )}
                        </button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {s.hasFeeStructure ? formatCurrency(s.paidAmount) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-amber-600 font-medium">
                      {s.hasFeeStructure ? formatCurrency(s.pendingAmount) : "—"}
                    </TableCell>
                    <TableCell>
                      {s.hasFeeStructure ? statusBadge(s.paymentStatus) : (
                        <Badge variant="outline">No Structure</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openDiscountDialog(s)}
                          title="Student discount"
                        >
                          <Percent className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/fee-collection/${s._id}?sessionId=${sessionId}`)}
                        >
                          <IndianRupee className="h-4 w-4 mr-1" />
                          Collect
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!loading && students.length > 0 && (
            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!discountStudent} onOpenChange={(open) => !open && setDiscountStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Discount</DialogTitle>
          </DialogHeader>
          {discountStudent && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <strong>{discountStudent.studentName}</strong> — Extra discount (₹) on top of class default discount.
              </p>
              <div className="text-sm space-y-1 rounded-lg bg-muted p-3">
                <div className="flex justify-between">
                  <span>Gross Fee</span>
                  <span>{formatCurrency(discountStudent.grossTotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Total Discount (after save)</span>
                  <span>
                    {formatCurrency(
                      Math.min(
                        discountStudent.grossTotal,
                        (discountStudent.totalDiscount - discountStudent.feeDiscount) + (Number(discountValue) || 0)
                      )
                    )}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Student Discount (₹)</label>
                <Input
                  type="number"
                  min={0}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDiscountStudent(null)}>Cancel</Button>
                <Button onClick={saveDiscount} disabled={savingDiscount}>
                  {savingDiscount ? "Saving..." : "Save Discount"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
