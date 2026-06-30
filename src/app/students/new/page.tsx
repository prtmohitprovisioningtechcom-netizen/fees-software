"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { classesApi, sectionsApi, studentsApi } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

const sdmsStudentSchema = z
  .object({
    className: z.string().min(1, "Required"),
    sectionName: z.string().min(1, "Required"),
    studentName: z.string().min(2, "Required"),
    gender: z.enum(["male", "female", "other"]),
    initializedAtSdms: z.string().optional(),
    admissionNumber: z.string().optional(),
    studentPen: z.string().optional(),
    studentStateCode: z.string().optional(),
    fatherName: z.string().optional(),
    motherName: z.string().optional(),
    socialCategory: z.string().optional(),
    minorityGroup: z.string().optional(),
    bplBeneficiary: z.string().optional(),
    cwsn: z.string().optional(),
    typeOfImpairments: z.string().optional(),
    isRepeater: z.string().optional(),
    suspectedDuplicate: z.string().optional(),
    entryStatus: z.string().optional(),
    aadharNumber: z.string().optional(),
    nameAsPerAadhaar: z.string().optional(),
    aadhaarValidationStatus: z.string().optional(),
    mbuStatus: z.string().optional(),
    apaarId: z.string().optional(),
    apaarStatus: z.string().optional(),
  })
  .refine((data) => data.admissionNumber || data.studentPen || data.studentStateCode || data.aadharNumber, {
    message: "Admission Number, Student PEN, State Code or AADHAAR No. required",
    path: ["admissionNumber"],
  });

type SdmsStudentForm = z.infer<typeof sdmsStudentSchema>;

const yesNoOptions = ["Yes", "No"];

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);
  const [sections, setSections] = useState<{ _id: string; name: string }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionName, setSelectedSectionName] = useState("");

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SdmsStudentForm>({
    resolver: zodResolver(sdmsStudentSchema),
    defaultValues: {
      gender: "other",
      initializedAtSdms: "Yes",
      bplBeneficiary: "No",
      cwsn: "No",
      isRepeater: "No",
      suspectedDuplicate: "No",
      entryStatus: "Active",
    },
  });

  useEffect(() => {
    classesApi.getAll().then((res) => setClasses((res as { data: typeof classes }).data));
  }, []);

  useEffect(() => {
    if (!selectedClassId) {
      setSections([]);
      setSelectedSectionName("");
      setValue("sectionName", "");
      return;
    }

    sectionsApi.getAll(selectedClassId).then((res) => setSections((res as { data: typeof sections }).data));
  }, [selectedClassId, setValue]);

  const onSubmit = async (data: SdmsStudentForm) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== "") formData.append(key, String(value));
      });

      await studentsApi.create(formData);
      toast({ title: "Success", description: "Student registered successfully" });
      router.push("/students");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register student",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Student Registration"
        description="Register student using SDMS fields. Same fields are supported in Excel upload."
        breadcrumbs={[{ label: "Students", href: "/students" }, { label: "Register" }]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>SDMS Student Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FormField label="Class" required error={errors.className?.message}>
              <input type="hidden" {...register("className")} />
              <Select
                value={selectedClassId}
                onValueChange={(classId) => {
                  const selectedClass = classes.find((item) => item._id === classId);
                  setSelectedClassId(classId);
                  setValue("className", selectedClass?.name || "", { shouldValidate: true });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((item) => (
                    <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Section" required error={errors.sectionName?.message}>
              <input type="hidden" {...register("sectionName")} />
              <Select
                value={selectedSectionName}
                onValueChange={(sectionName) => {
                  setSelectedSectionName(sectionName);
                  setValue("sectionName", sectionName, { shouldValidate: true });
                }}
                disabled={!selectedClassId}
              >
                <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                <SelectContent>
                  {sections.map((item) => (
                    <SelectItem key={item._id} value={item.name}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Name" required error={errors.studentName?.message}>
              <Input {...register("studentName")} />
            </FormField>
            <FormField label="Gender" required error={errors.gender?.message}>
              <Select onValueChange={(value) => setValue("gender", value as SdmsStudentForm["gender"])} defaultValue="other">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Initialised at SDMS">
              <Select onValueChange={(value) => setValue("initializedAtSdms", value)} defaultValue="Yes">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yesNoOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Admission Number" required error={errors.admissionNumber?.message}>
              <Input {...register("admissionNumber")} placeholder="School admission number" />
            </FormField>
            <FormField label="Student PEN" error={errors.studentPen?.message}>
              <Input {...register("studentPen")} />
            </FormField>
            <FormField label="Student State Code">
              <Input {...register("studentStateCode")} />
            </FormField>
            <FormField label="Father Name">
              <Input {...register("fatherName")} />
            </FormField>
            <FormField label="Mother Name">
              <Input {...register("motherName")} />
            </FormField>
            <FormField label="Social Category">
              <Input {...register("socialCategory")} placeholder="General / OBC / SC / ST" />
            </FormField>
            <FormField label="Minority Group">
              <Input {...register("minorityGroup")} />
            </FormField>
            <FormField label="BPL beneficiary">
              <Select onValueChange={(value) => setValue("bplBeneficiary", value)} defaultValue="No">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yesNoOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="CWSN">
              <Select onValueChange={(value) => setValue("cwsn", value)} defaultValue="No">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yesNoOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Type of Impairments">
              <Input {...register("typeOfImpairments")} />
            </FormField>
            <FormField label="Is Repeater">
              <Select onValueChange={(value) => setValue("isRepeater", value)} defaultValue="No">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yesNoOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Suspected Duplicate">
              <Select onValueChange={(value) => setValue("suspectedDuplicate", value)} defaultValue="No">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yesNoOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Entry Status">
              <Input {...register("entryStatus")} placeholder="Active" />
            </FormField>
            <FormField label="AADHAAR No.">
              <Input {...register("aadharNumber")} maxLength={12} />
            </FormField>
            <FormField label="Name As per AADHAAR">
              <Input {...register("nameAsPerAadhaar")} />
            </FormField>
            <FormField label="AADHAAR Validation Status">
              <Input {...register("aadhaarValidationStatus")} />
            </FormField>
            <FormField label="MBU Status">
              <Input {...register("mbuStatus")} />
            </FormField>
            <FormField label="APAAR ID">
              <Input {...register("apaarId")} />
            </FormField>
            <FormField label="APAAR Status">
              <Input {...register("apaarStatus")} />
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
