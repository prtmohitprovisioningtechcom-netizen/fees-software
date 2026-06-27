"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Pencil, IndianRupee } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { studentsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function ViewStudentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    studentsApi.getById(id).then((res) => setStudent((res as { data: Record<string, unknown> }).data));
  }, [id]);

  if (!student) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </DashboardLayout>
    );
  }

  const cls = student.classId as { name: string };
  const sec = student.sectionId as { name: string };
  const sess = student.sessionId as { name: string };
  const addr = student.address as { line1: string; city: string; state: string; pincode: string };

  return (
    <DashboardLayout>
      <PageHeader
        title={student.studentName as string}
        description={`Registration: ${student.registrationNumber}`}
        breadcrumbs={[{ label: "Students", href: "/students" }, { label: "View" }]}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/students/${id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </Button>
            <Button onClick={() => router.push(`/fee-collection/${id}`)}>
              <IndianRupee className="h-4 w-4 mr-2" /> Collect Fee
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center">
            {student.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={student.photo as string}
                alt="Student"
                className="h-[150px] w-[150px] rounded-xl object-cover border"
              />
            ) : (
              <div className="h-[150px] w-[150px] rounded-xl bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground">
                {(student.studentName as string)?.[0]}
              </div>
            )}
            <h2 className="mt-4 text-xl font-bold">{student.studentName as string}</h2>
            <p className="text-muted-foreground">{student.registrationNumber as string}</p>
            <Badge className="mt-2" variant={student.status === "active" ? "success" : "secondary"}>
              {student.status as string}
            </Badge>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
              <div><span className="text-muted-foreground">Admission No:</span> <strong>{student.admissionNumber as string}</strong></div>
              <div><span className="text-muted-foreground">Roll No:</span> <strong>{student.rollNumber as string}</strong></div>
              <div><span className="text-muted-foreground">Father:</span> <strong>{student.fatherName as string}</strong></div>
              <div><span className="text-muted-foreground">Mother:</span> <strong>{student.motherName as string}</strong></div>
              <div><span className="text-muted-foreground">Mobile:</span> <strong>{student.mobileNumber as string}</strong></div>
              <div><span className="text-muted-foreground">Gender:</span> <strong className="capitalize">{student.gender as string}</strong></div>
              <div><span className="text-muted-foreground">DOB:</span> <strong>{formatDate(student.dateOfBirth as string)}</strong></div>
              <div><span className="text-muted-foreground">Blood Group:</span> <strong>{(student.bloodGroup as string) || "N/A"}</strong></div>
              <div><span className="text-muted-foreground">Category:</span> <strong>{(student.category as string) || "N/A"}</strong></div>
              <div><span className="text-muted-foreground">Aadhar:</span> <strong>{(student.aadharNumber as string) || "N/A"}</strong></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Academic Details</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
              <div><span className="text-muted-foreground">Class:</span> <strong>{cls?.name}</strong></div>
              <div><span className="text-muted-foreground">Section:</span> <strong>{sec?.name}</strong></div>
              <div><span className="text-muted-foreground">Session:</span> <strong>{sess?.name}</strong></div>
              <div><span className="text-muted-foreground">Admission Date:</span> <strong>{formatDate(student.admissionDate as string)}</strong></div>
              <div><span className="text-muted-foreground">Transport:</span> <strong>{student.transportRequired ? "Yes" : "No"}</strong></div>
              <div><span className="text-muted-foreground">Previous School:</span> <strong>{(student.previousSchool as string) || "N/A"}</strong></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Address</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <p>{addr?.line1}</p>
              <p>{addr?.city}, {addr?.state} - {addr?.pincode}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
