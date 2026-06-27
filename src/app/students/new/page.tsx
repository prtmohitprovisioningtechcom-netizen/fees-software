"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { classesApi, sectionsApi, sessionsApi, studentsApi } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

const studentFormSchema = z.object({
  admissionNumber: z.string().min(1, "Required"),
  rollNumber: z.string().min(1, "Required"),
  studentName: z.string().min(2, "Required"),
  fatherName: z.string().min(2, "Required"),
  motherName: z.string().min(2, "Required"),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile required"),
  alternateMobile: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string().min(1, "Required"),
  bloodGroup: z.string().optional(),
  category: z.string().optional(),
  religion: z.string().optional(),
  aadharNumber: z.string().optional(),
  classId: z.string().min(1, "Required"),
  sectionId: z.string().min(1, "Required"),
  sessionId: z.string().min(1, "Required"),
  admissionDate: z.string().min(1, "Required"),
  addressLine1: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  state: z.string().min(1, "Required"),
  pincode: z.string().regex(/^\d{6}$/, "Valid 6-digit pincode required"),
  status: z.enum(["active", "inactive", "left"]).optional(),
  previousSchool: z.string().optional(),
  transportRequired: z.boolean().optional(),
});

type StudentForm = z.infer<typeof studentFormSchema>;

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);
  const [sections, setSections] = useState<{ _id: string; name: string }[]>([]);
  const [sessions, setSessions] = useState<{ _id: string; name: string }[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<StudentForm>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: { gender: "male", status: "active", transportRequired: false },
  });

  const classId = watch("classId");

  useEffect(() => {
    Promise.all([classesApi.getAll(), sessionsApi.getAll()]).then(([cRes, sRes]) => {
      setClasses((cRes as { data: typeof classes }).data);
      setSessions((sRes as { data: typeof sessions }).data);
    });
  }, []);

  useEffect(() => {
    if (classId) {
      sectionsApi.getAll(classId).then((res) => setSections((res as { data: typeof sections }).data));
    }
  }, [classId]);

  const onSubmit = async (data: StudentForm) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith("address")) return;
        if (value !== undefined && value !== "") formData.append(key, String(value));
      });
      formData.append("address", JSON.stringify({
        line1: data.addressLine1,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
      }));
      if (photo) formData.append("photo", photo);

      await studentsApi.create(formData);
      toast({ title: "Success", description: "Student registered successfully" });
      router.push("/students");
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Student Registration"
        description="Register a new student"
        breadcrumbs={[{ label: "Students", href: "/students" }, { label: "Register" }]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FormField label="Admission Number" required error={errors.admissionNumber?.message}>
              <Input {...register("admissionNumber")} />
            </FormField>
            <FormField label="Roll Number" required error={errors.rollNumber?.message}>
              <Input {...register("rollNumber")} />
            </FormField>
            <FormField label="Student Name" required error={errors.studentName?.message}>
              <Input {...register("studentName")} />
            </FormField>
            <FormField label="Father Name" required error={errors.fatherName?.message}>
              <Input {...register("fatherName")} />
            </FormField>
            <FormField label="Mother Name" required error={errors.motherName?.message}>
              <Input {...register("motherName")} />
            </FormField>
            <FormField label="Mobile Number" required error={errors.mobileNumber?.message}>
              <Input {...register("mobileNumber")} maxLength={10} />
            </FormField>
            <FormField label="Alternate Mobile" error={errors.alternateMobile?.message}>
              <Input {...register("alternateMobile")} maxLength={10} />
            </FormField>
            <FormField label="Email" error={errors.email?.message}>
              <Input type="email" {...register("email")} />
            </FormField>
            <FormField label="Gender" required error={errors.gender?.message}>
              <Select onValueChange={(v) => setValue("gender", v as StudentForm["gender"])} defaultValue="male">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Date of Birth" required error={errors.dateOfBirth?.message}>
              <Input type="date" {...register("dateOfBirth")} />
            </FormField>
            <FormField label="Blood Group">
              <Input {...register("bloodGroup")} placeholder="e.g. B+" />
            </FormField>
            <FormField label="Category">
              <Select onValueChange={(v) => setValue("category", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["General", "OBC", "SC", "ST", "EWS"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Religion">
              <Input {...register("religion")} />
            </FormField>
            <FormField label="Aadhar Number" error={errors.aadharNumber?.message}>
              <Input {...register("aadharNumber")} maxLength={12} />
            </FormField>
            <FormField label="Student Photo">
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Academic Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FormField label="Class" required error={errors.classId?.message}>
              <Select onValueChange={(v) => { setValue("classId", v); setValue("sectionId", ""); }}>
                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Section" required error={errors.sectionId?.message}>
              <Select onValueChange={(v) => setValue("sectionId", v)} disabled={!classId}>
                <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                <SelectContent>
                  {sections.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Session" required error={errors.sessionId?.message}>
              <Select onValueChange={(v) => setValue("sessionId", v)}>
                <SelectTrigger><SelectValue placeholder="Select Session" /></SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Admission Date" required error={errors.admissionDate?.message}>
              <Input type="date" {...register("admissionDate")} />
            </FormField>
            <FormField label="Previous School">
              <Input {...register("previousSchool")} />
            </FormField>
            <FormField label="Status">
              <Select onValueChange={(v) => setValue("status", v as StudentForm["status"])} defaultValue="active">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Transport Required">
              <Select onValueChange={(v) => setValue("transportRequired", v === "true")} defaultValue="false">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Address</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField label="Address" required error={errors.addressLine1?.message} className="md:col-span-2">
              <Input {...register("addressLine1")} />
            </FormField>
            <FormField label="City" required error={errors.city?.message}>
              <Input {...register("city")} />
            </FormField>
            <FormField label="State" required error={errors.state?.message}>
              <Input {...register("state")} />
            </FormField>
            <FormField label="Pincode" required error={errors.pincode?.message}>
              <Input {...register("pincode")} maxLength={6} />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/students")}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Register Student
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
