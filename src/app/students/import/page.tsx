"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { studentsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/components/ui/use-toast";

interface ImportError {
  row: number;
  admissionNumber?: string;
  studentName?: string;
  message: string;
}

interface ImportedStudent {
  _id: string;
  registrationNumber: string;
  admissionNumber: string;
  studentName: string;
  className: string;
  sectionName: string;
}

interface ImportResult {
  importedCount: number;
  failedCount: number;
  totalRows: number;
  imported: ImportedStudent[];
  errors: ImportError[];
}

export default function StudentImportPage() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const downloadTemplate = () => {
    const headers = [
      "Class",
      "Section",
      "Name",
      "Gender",
      "Initialised at SDMS",
      "Student PEN",
      "Student State Code",
      "Father Name",
      "Mother Name",
      "Social Category",
      "Minority Group",
      "BPL beneficiary",
      "CWSN",
      "Type of Impairments",
      "Is Repeater",
      "Suspected Duplicate",
      "Entry Status",
      "AADHAAR No.",
      "Name As per AADHAAR",
      "AADHAAR Validation Status",
      "MBU Status",
      "APAAR ID",
      "APAAR Status",
    ];
    const sample = [
      "Class 1",
      "A",
      "Rahul Kumar",
      "male",
      "Yes",
      "12345678901",
      "ST12345",
      "Suresh Kumar",
      "Sunita Devi",
      "General",
      "",
      "No",
      "No",
      "",
      "No",
      "No",
      "Active",
      "123412341234",
      "Rahul Kumar",
      "Verified",
      "",
      "",
      "",
    ];
    const csv = `\uFEFF${headers.join(",")}\n${sample.join(",")}\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "students-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "File required", description: "Please select an Excel or CSV file.", variant: "destructive" });
      return;
    }

    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = (await studentsApi.importExcel(formData)) as { data: ImportResult; message: string };
      setResult(res.data);
      toast({ title: "Import complete", description: res.message });
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Could not import students",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!authLoading && !isSuperAdmin) {
    return (
      <DashboardLayout>
        <PageHeader title="Excel Import" description="Only Super Admin can upload student Excel sheets." breadcrumbs={[{ label: "Students", href: "/students" }, { label: "Excel Import" }]} />
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Access denied.</CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Student Excel Import"
        description="Upload SDMS student Excel in bulk. Imported students appear in Students and Fee Collection class-wise."
        breadcrumbs={[{ label: "Students", href: "/students" }, { label: "Excel Import" }]}
        action={
          <Button variant="outline" asChild>
            <Link href="/students">Back to Students</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Upload Excel Sheet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <FormField label="Excel or CSV File" required>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </FormField>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload Students
              </Button>
              <Button type="button" variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Required Columns</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Required from SDMS sheet: Class, Section, Name, Gender and Student PEN or Student State Code.</p>
            <p>Supported columns: Initialised at SDMS, Student PEN, Student State Code, Father Name, Mother Name, Social Category, Minority Group, BPL beneficiary, CWSN, Type of Impairments, Is Repeater, Suspected Duplicate, Entry Status, AADHAAR No., Name As per AADHAAR, AADHAAR Validation Status, MBU Status, APAAR ID, APAAR Status.</p>
            <p>Session is picked automatically from the current active academic session. If a class or section does not exist, Super Admin import will create it automatically.</p>
            <p>After import, open Fee Collection and filter by class to collect fees for these students.</p>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.failedCount ? <AlertCircle className="h-5 w-5 text-destructive" /> : <CheckCircle2 className="h-5 w-5 text-green-600" />}
              Import Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Total Rows</p><p className="text-2xl font-bold">{result.totalRows}</p></div>
              <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Imported</p><p className="text-2xl font-bold text-green-600">{result.importedCount}</p></div>
              <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Failed</p><p className="text-2xl font-bold text-destructive">{result.failedCount}</p></div>
            </div>

            {result.imported.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold">Imported Students</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reg. No.</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.imported.slice(0, 100).map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>{student.registrationNumber}</TableCell>
                        <TableCell>{student.admissionNumber}</TableCell>
                        <TableCell>{student.studentName}</TableCell>
                        <TableCell>{student.className}</TableCell>
                        <TableCell>{student.sectionName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {result.imported.length > 100 && (
                  <p className="mt-2 text-xs text-muted-foreground">Showing first 100 imported students. Full list is available on Students page.</p>
                )}
              </div>
            )}

            {result.errors.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold">Failed Rows</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.errors.slice(0, 50).map((error) => (
                    <TableRow key={`${error.row}-${error.message}`}>
                      <TableCell>{error.row}</TableCell>
                      <TableCell>{error.admissionNumber || "-"}</TableCell>
                      <TableCell>{error.studentName || "-"}</TableCell>
                      <TableCell className="text-destructive">{error.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
