"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Eye, Pencil, Trash2, Upload } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { studentsApi, classesApi, sectionsApi } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";

interface Student {
  _id: string;
  registrationNumber: string;
  admissionNumber: string;
  studentName: string;
  fatherName: string;
  mobileNumber: string;
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
  status: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);
  const [sections, setSections] = useState<{ _id: string; name: string }[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: "10" };
      if (search) params.search = search;
      if (classFilter) params.classId = classFilter;
      if (sectionFilter) params.sectionId = sectionFilter;

      const res = await studentsApi.getAll(params) as {
        data: Student[];
        pagination: { total: number; totalPages: number };
      };
      setStudents(res.data);
      setPagination(res.pagination);
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, search, classFilter, sectionFilter]);

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
    const timer = setTimeout(fetchStudents, 300);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await studentsApi.delete(deleteId);
      toast({ title: "Deleted", description: "Student deleted successfully" });
      fetchStudents();
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
    setDeleteId(null);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Students"
        description="Manage all registered students"
        breadcrumbs={[{ label: "Students" }]}
        action={
          <div className="flex flex-wrap gap-2">
            {isSuperAdmin && (
              <Button variant="outline" onClick={() => router.push("/students/import")}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Excel
              </Button>
            )}
            <Button onClick={() => router.push("/students/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Register Student
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search by name, reg no, mobile..."
            />
            <Select value={classFilter} onValueChange={(v) => { setClassFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Filter by Class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sectionFilter} onValueChange={(v) => { setSectionFilter(v === "all" ? "" : v); setPage(1); }} disabled={!classFilter}>
              <SelectTrigger><SelectValue placeholder="Filter by Section" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reg. No.</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Father Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : students.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No students found</TableCell></TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell className="font-medium">{student.registrationNumber}</TableCell>
                    <TableCell>{student.studentName}</TableCell>
                    <TableCell>{student.fatherName}</TableCell>
                    <TableCell>{student.classId?.name}</TableCell>
                    <TableCell>{student.sectionId?.name}</TableCell>
                    <TableCell>{student.mobileNumber}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === "active" ? "success" : "secondary"}>{student.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/students/${student._id}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/students/${student._id}/edit`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                        {isSuperAdmin && (
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(student._id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
