"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { FormField } from "@/components/shared/form-field";
import { FlexibleDateInput } from "@/components/shared/flexible-date-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { classesApi, sectionsApi, sessionsApi, studentsApi } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { refId, toLocalDateInput } from "@/lib/student-display";

type EditForm = {
  registrationNumber: string;
  admissionNumber: string;
  rollNumber: string;
  studentName: string;
  studentPen: string;
  fatherName: string;
  motherName: string;
  mobileNumber: string;
  gender: "male" | "female" | "other";
  dateOfBirth: string;
  classId: string;
  sectionId: string;
  sessionId: string;
  admissionDate: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  status: "active" | "inactive" | "left";
  studentStateCode: string;
  aadharNumber: string;
  socialCategory: string;
};

export default function EditStudentPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);
  const [sections, setSections] = useState<{ _id: string; name: string }[]>([]);
  const [sessions, setSessions] = useState<{ _id: string; name: string }[]>([]);

  const { register, handleSubmit, setValue, watch, reset } = useForm<EditForm>({
    defaultValues: {
      registrationNumber: "",
      admissionNumber: "",
      rollNumber: "",
      studentName: "",
      studentPen: "",
      fatherName: "",
      motherName: "",
      mobileNumber: "",
      gender: "other",
      dateOfBirth: "",
      classId: "",
      sectionId: "",
      sessionId: "",
      admissionDate: "",
      addressLine1: "",
      city: "",
      state: "",
      pincode: "",
      status: "active",
      studentStateCode: "",
      aadharNumber: "",
      socialCategory: "",
    },
  });

  const classId = watch("classId");

  useEffect(() => {
    let cancelled = false;
    setLoadingStudent(true);
    Promise.all([classesApi.getAll(), sessionsApi.getAll(), studentsApi.getById(id)])
      .then(([cRes, sRes, stRes]) => {
        if (cancelled) return;
        setClasses((cRes as { data: typeof classes }).data || []);
        setSessions((sRes as { data: typeof sessions }).data || []);
        const st = (stRes as { data: Record<string, unknown> }).data;
        const addr = (st.address as { line1?: string; city?: string; state?: string; pincode?: string }) || {};
        reset({
          registrationNumber: String(st.registrationNumber || ""),
          admissionNumber: String(st.admissionNumber || ""),
          rollNumber: String(st.rollNumber || ""),
          studentName: String(st.studentName || ""),
          studentPen: String(st.studentPen || ""),
          fatherName: String(st.fatherName || ""),
          motherName: String(st.motherName || ""),
          mobileNumber: String(st.mobileNumber || ""),
          gender: (st.gender as EditForm["gender"]) || "other",
          dateOfBirth: toLocalDateInput(st.dateOfBirth),
          classId: refId(st.classId),
          sectionId: refId(st.sectionId),
          sessionId: refId(st.sessionId),
          admissionDate: toLocalDateInput(st.admissionDate),
          addressLine1: String(addr.line1 || ""),
          city: String(addr.city || ""),
          state: String(addr.state || ""),
          pincode: String(addr.pincode || ""),
          status: (st.status as EditForm["status"]) || "active",
          studentStateCode: String(st.studentStateCode || ""),
          aadharNumber: String(st.aadharNumber || ""),
          socialCategory: String(st.category || ""),
        });
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load student",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingStudent(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, reset]);

  useEffect(() => {
    if (!classId) {
      setSections([]);
      return;
    }
    sectionsApi.getAll(classId).then((res) => setSections((res as { data: typeof sections }).data || []));
  }, [classId]);

  const onSubmit = async (data: EditForm) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("registrationNumber", data.registrationNumber || "");
      formData.append("admissionNumber", data.admissionNumber || "");
      formData.append("rollNumber", data.rollNumber || "");
      formData.append("studentName", data.studentName || "");
      formData.append("studentPen", data.studentPen || "");
      formData.append("fatherName", data.fatherName || "");
      formData.append("motherName", data.motherName || "");
      formData.append("mobileNumber", data.mobileNumber || "");
      formData.append("gender", data.gender || "other");
      formData.append("dateOfBirth", data.dateOfBirth || "");
      formData.append("admissionDate", data.admissionDate || "");
      formData.append("classId", data.classId || "");
      formData.append("sectionId", data.sectionId || "");
      formData.append("sessionId", data.sessionId || "");
      formData.append("status", data.status || "active");
      formData.append("studentStateCode", data.studentStateCode || "");
      formData.append("aadharNumber", data.aadharNumber || "");
      formData.append("category", data.socialCategory || "");
      formData.append(
        "address",
        JSON.stringify({
          line1: data.addressLine1 || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
        })
      );

      await studentsApi.update(id, formData);
      toast({ title: "Updated", description: "Student updated successfully" });
      router.push(`/students/${id}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingStudent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading student…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Edit Student"
        description="Saari details pehle se filled hain — jo change karna ho woh edit karein. Koi field required nahi."
        breadcrumbs={[{ label: "Students", href: "/students" }, { label: "Edit" }]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Student Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FormField label="Registration Number">
              <Input {...register("registrationNumber")} placeholder="Change if needed" />
            </FormField>
            <FormField label="Admission Number">
              <Input {...register("admissionNumber")} />
            </FormField>
            <FormField label="PEN Number">
              <Input {...register("studentPen")} placeholder="Student PEN" />
            </FormField>
            <FormField label="Roll Number">
              <Input {...register("rollNumber")} />
            </FormField>
            <FormField label="Student Name">
              <Input {...register("studentName")} />
            </FormField>
            <FormField label="Father Name">
              <Input {...register("fatherName")} />
            </FormField>
            <FormField label="Mother Name">
              <Input {...register("motherName")} />
            </FormField>
            <FormField label="Mobile">
              <Input {...register("mobileNumber")} maxLength={10} />
            </FormField>
            <FormField label="Gender">
              <Select
                value={watch("gender")}
                onValueChange={(v) => setValue("gender", v as EditForm["gender"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Date of Birth">
              <FlexibleDateInput
                value={watch("dateOfBirth")}
                onChange={(v) => setValue("dateOfBirth", v)}
              />
            </FormField>
            <FormField label="Admission Date">
              <FlexibleDateInput
                value={watch("admissionDate")}
                onChange={(v) => setValue("admissionDate", v)}
              />
            </FormField>
            <FormField label="Class">
              <Select
                value={watch("classId") || undefined}
                onValueChange={(v) => {
                  setValue("classId", v);
                  setValue("sectionId", "");
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Section">
              <Select
                value={watch("sectionId") || undefined}
                onValueChange={(v) => setValue("sectionId", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Session">
              <Select
                value={watch("sessionId") || undefined}
                onValueChange={(v) => setValue("sessionId", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select
                value={watch("status")}
                onValueChange={(v) => setValue("status", v as EditForm["status"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Student State Code">
              <Input {...register("studentStateCode")} />
            </FormField>
            <FormField label="AADHAAR No.">
              <Input {...register("aadharNumber")} maxLength={12} />
            </FormField>
            <FormField label="Social Category">
              <Input {...register("socialCategory")} placeholder="General / OBC / SC / ST" />
            </FormField>
            <FormField label="Address" className="md:col-span-2">
              <Input {...register("addressLine1")} />
            </FormField>
            <FormField label="City"><Input {...register("city")} /></FormField>
            <FormField label="State"><Input {...register("state")} /></FormField>
            <FormField label="Pincode"><Input {...register("pincode")} maxLength={6} /></FormField>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Update Student
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
