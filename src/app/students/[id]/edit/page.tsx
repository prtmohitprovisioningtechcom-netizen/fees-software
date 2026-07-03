"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { classesApi, sectionsApi, sessionsApi, studentsApi, transportRoutesApi } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

const editSchema = z.object({
  admissionNumber: z.string().min(1),
  rollNumber: z.string().min(1),
  studentName: z.string().min(2),
  fatherName: z.string().min(2),
  motherName: z.string().min(2),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string().min(1),
  classId: z.string().min(1),
  sectionId: z.string().min(1),
  sessionId: z.string().min(1),
  admissionDate: z.string().min(1),
  addressLine1: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/),
  status: z.enum(["active", "inactive", "left"]),
  transportRequired: z.boolean(),
  transportRouteId: z.string().optional(),
}).refine((data) => !data.transportRequired || Boolean(data.transportRouteId?.trim()), {
  message: "Select a transport route when school transport is enabled",
  path: ["transportRouteId"],
});

type EditForm = z.infer<typeof editSchema>;

export default function EditStudentPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [regNo, setRegNo] = useState("");
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);
  const [sections, setSections] = useState<{ _id: string; name: string }[]>([]);
  const [sessions, setSessions] = useState<{ _id: string; name: string }[]>([]);
  const [transportRoutes, setTransportRoutes] = useState<{ _id: string; name: string; monthlyFee: number }[]>([]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      admissionNumber: "",
      rollNumber: "",
      studentName: "",
      fatherName: "",
      motherName: "",
      mobileNumber: "",
      gender: "male",
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
      transportRequired: false,
      transportRouteId: "",
    },
  });

  const classId = watch("classId");

  useEffect(() => {
    Promise.all([classesApi.getAll(), sessionsApi.getAll(), transportRoutesApi.getAll(), studentsApi.getById(id)]).then(
      ([cRes, sRes, routesRes, stRes]) => {
        setClasses((cRes as { data: typeof classes }).data);
        setSessions((sRes as { data: typeof sessions }).data);
        setTransportRoutes((routesRes as { data: typeof transportRoutes }).data);
        const st = (stRes as { data: Record<string, unknown> }).data;
        setRegNo(st.registrationNumber as string);
        const addr = st.address as { line1: string; city: string; state: string; pincode: string };
        const routeRef = st.transportRouteId as { _id?: string } | string | undefined;
        const routeId = typeof routeRef === "string" ? routeRef : routeRef?._id || "";
        reset({
          admissionNumber: st.admissionNumber as string,
          rollNumber: st.rollNumber as string,
          studentName: st.studentName as string,
          fatherName: st.fatherName as string,
          motherName: st.motherName as string,
          mobileNumber: st.mobileNumber as string,
          gender: st.gender as EditForm["gender"],
          dateOfBirth: (st.dateOfBirth as string).split("T")[0],
          classId: (st.classId as { _id: string })._id,
          sectionId: (st.sectionId as { _id: string })._id,
          sessionId: (st.sessionId as { _id: string })._id,
          admissionDate: (st.admissionDate as string).split("T")[0],
          addressLine1: addr.line1,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          status: st.status as EditForm["status"],
          transportRequired: Boolean(st.transportRequired),
          transportRouteId: routeId,
        });
      }
    );
  }, [id, reset]);

  useEffect(() => {
    if (classId) sectionsApi.getAll(classId).then((res) => setSections((res as { data: typeof sections }).data));
  }, [classId]);

  const onSubmit = async (data: EditForm) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (!key.startsWith("address")) formData.append(key, String(value));
      });
      formData.append("address", JSON.stringify({
        line1: data.addressLine1, city: data.city, state: data.state, pincode: data.pincode,
      }));
      await studentsApi.update(id, formData);
      toast({ title: "Updated", description: "Student updated successfully" });
      router.push("/students");
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Edit Student"
        description={`Registration: ${regNo} (cannot be changed)`}
        breadcrumbs={[{ label: "Students", href: "/students" }, { label: "Edit" }]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Student Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FormField label="Registration Number">
              <Input value={regNo} disabled className="bg-muted" />
            </FormField>
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
            <FormField label="Mobile" required error={errors.mobileNumber?.message}>
              <Input {...register("mobileNumber")} maxLength={10} />
            </FormField>
            <FormField label="Gender" required>
              <Select onValueChange={(v) => setValue("gender", v as EditForm["gender"])} value={watch("gender")}>
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
            <FormField label="Class" required>
              <Select onValueChange={(v) => { setValue("classId", v); setValue("sectionId", ""); }} value={watch("classId")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Section" required>
              <Select onValueChange={(v) => setValue("sectionId", v)} value={watch("sectionId")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{sections.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Session" required>
              <Select onValueChange={(v) => setValue("sessionId", v)} value={watch("sessionId")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{sessions.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select onValueChange={(v) => setValue("status", v as EditForm["status"])} value={watch("status")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="School Transport">
              <label className="flex items-center gap-2 text-sm cursor-pointer rounded-md border px-3 py-2">
                <input
                  type="checkbox"
                  checked={watch("transportRequired")}
                  onChange={(e) => {
                    setValue("transportRequired", e.target.checked, { shouldValidate: true });
                    if (!e.target.checked) setValue("transportRouteId", "", { shouldValidate: true });
                  }}
                  className="rounded"
                />
                <span>Student uses school transport</span>
              </label>
            </FormField>
            {watch("transportRequired") ? (
              <FormField label="Transport Route" required error={errors.transportRouteId?.message}>
                <Select
                  value={watch("transportRouteId") || ""}
                  onValueChange={(value) => setValue("transportRouteId", value, { shouldValidate: true })}
                >
                  <SelectTrigger><SelectValue placeholder="Select village / route" /></SelectTrigger>
                  <SelectContent>
                    {transportRoutes.map((route) => (
                      <SelectItem key={route._id} value={route._id}>
                        {route.name} — {route.monthlyFee}/mo
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            ) : null}
            <FormField label="Address" required className="md:col-span-2" error={errors.addressLine1?.message}>
              <Input {...register("addressLine1")} />
            </FormField>
            <FormField label="City" required error={errors.city?.message}><Input {...register("city")} /></FormField>
            <FormField label="State" required error={errors.state?.message}><Input {...register("state")} /></FormField>
            <FormField label="Pincode" required error={errors.pincode?.message}><Input {...register("pincode")} maxLength={6} /></FormField>
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
