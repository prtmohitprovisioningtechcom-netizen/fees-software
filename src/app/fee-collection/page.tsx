"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { studentsApi, classesApi, sectionsApi } from "@/lib/api";
import { IndianRupee, Users } from "lucide-react";

interface Student {
  _id: string;
  registrationNumber: string;
  admissionNumber: string;
  studentName: string;
  fatherName: string;
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
  mobileNumber: string;
  status: string;
}

function matchScore(student: Student, query: string): number {
  const q = query.toLowerCase();
  let score = 0;
  if (student.studentName.toLowerCase().includes(q)) score += 10;
  if (student.registrationNumber.toLowerCase().includes(q)) score += 9;
  if (student.admissionNumber?.toLowerCase().includes(q)) score += 8;
  if (student.fatherName.toLowerCase().includes(q)) score += 7;
  if (student.mobileNumber.includes(q)) score += 6;
  if (student.classId?.name?.toLowerCase().includes(q)) score += 5;
  if (student.sectionId?.name?.toLowerCase().includes(q)) score += 4;
  return score;
}

export default function FeeCollectionPage() {
  const router = useRouter();
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);
  const [sections, setSections] = useState<{ _id: string; name: string }[]>([]);

  const limit = 20;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
        status: "active",
      };
      if (classFilter) params.classId = classFilter;
      if (sectionFilter) params.sectionId = sectionFilter;
      // When searching, also pass to API for broader match across pages
      if (search.trim()) params.search = search.trim();

      const res = (await studentsApi.getAll(params)) as {
        data: Student[];
        pagination: { total: number; totalPages: number };
      };
      setAllStudents(res.data);
      setPagination(res.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, classFilter, sectionFilter, search]);

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

  // Search ke baad matching students upar — client-side sort on current results
  const displayedStudents = useMemo(() => {
    const q = search.trim();
    if (!q) return allStudents;

    return [...allStudents].sort((a, b) => matchScore(b, q) - matchScore(a, q));
  }, [allStudents, search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Fee Collection"
        description="All students are listed below. Search to find a student quickly."
        breadcrumbs={[{ label: "Fee Collection" }]}
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Search name, reg no, admission no, mobile, class..."
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
          {!loading && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {pagination.total} active student{pagination.total !== 1 ? "s" : ""} found
              {search.trim() && " — matching results shown on top"}
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
                <TableHead>Father Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Loading students...
                  </TableCell>
                </TableRow>
              ) : displayedStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    {search.trim() ? "No matching students found" : "No students registered yet"}
                  </TableCell>
                </TableRow>
              ) : (
                displayedStudents.map((s) => {
                  const isMatch = search.trim() && matchScore(s, search.trim()) > 0;
                  return (
                    <TableRow
                      key={s._id}
                      className={isMatch ? "bg-primary/5 border-l-2 border-l-primary" : undefined}
                    >
                      <TableCell className="font-medium">{s.registrationNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {s.studentName}
                          {isMatch && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              Match
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{s.fatherName}</TableCell>
                      <TableCell>{s.classId?.name}</TableCell>
                      <TableCell>{s.sectionId?.name}</TableCell>
                      <TableCell>{s.mobileNumber}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => router.push(`/fee-collection/${s._id}`)}>
                          <IndianRupee className="h-4 w-4 mr-1" />
                          Collect Fee
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {!loading && displayedStudents.length > 0 && (
            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
