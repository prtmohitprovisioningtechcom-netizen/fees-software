"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { classesApi, sectionsApi, studentsApi } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

type SdmsStudentForm = {
  registrationNumber: string;
  className: string;
  sectionName: string;
  studentName: string;
  gender: "male" | "female" | "other";
  dateOfBirth: string;
  initializedAtSdms: string;
  admissionNumber: string;
  studentPen: string;
  studentStateCode: string;
  fatherName: string;
  motherName: string;
  socialCategory: string;
  minorityGroup: string;
  bplBeneficiary: string;
  cwsn: string;
  typeOfImpairments: string;
  isRepeater: string;
  suspectedDuplicate: string;
  entryStatus: string;
  aadharNumber: string;
  nameAsPerAadhaar: string;
  aadhaarValidationStatus: string;
  mbuStatus: string;
  apaarId: string;
  apaarStatus: string;
};

const yesNoOptions = ["Yes", "No"];

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);
  const [sections, setSections] = useState<{ _id: string; name: string }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionName, setSelectedSectionName] = useState("");

  const { register, handleSubmit, setValue, watch } = useForm<SdmsStudentForm>({
    defaultValues: {
      registrationNumber: "",
      className: "",
      sectionName: "",
      studentName: "",
      gender: "other",
      dateOfBirth: "",
      initializedAtSdms: "Yes",
      admissionNumber: "",
      studentPen: "",
      studentStateCode: "",
      fatherName: "",
      motherName: "",
      socialCategory: "",
      minorityGroup: "",
      bplBeneficiary: "No",
      cwsn: "No",
      typeOfImpairments: "",
      isRepeater: "No",
      suspectedDuplicate: "No",
      entryStatus: "Active",
      aadharNumber: "",
      nameAsPerAadhaar: "",
      aadhaarValidationStatus: "",
      mbuStatus: "",
      apaarId: "",
      apaarStatus: "",
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
      formData.append("transportRequired", "No");

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
        description="Jo field bharna ho woh bharein — koi field required nahi. Transport / fees baad mein Fee Collection se."
        breadcrumbs={[{ label: "Students", href: "/students" }, { label: "Register" }]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>SDMS Student Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FormField label="Registration Number">
              <Input {...register("registrationNumber")} placeholder="Blank = auto generate" />
            </FormField>
            <FormField label="Class">
              <input type="hidden" {...register("className")} />
              <Select
                value={selectedClassId || undefined}
                onValueChange={(classId) => {
                  const selectedClass = classes.find((item) => item._id === classId);
                  setSelectedClassId(classId);
                  setValue("className", selectedClass?.name || "");
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
            <FormField label="Section">
              <input type="hidden" {...register("sectionName")} />
              <Select
                value={selectedSectionName || undefined}
                onValueChange={(sectionName) => {
                  setSelectedSectionName(sectionName);
                  setValue("sectionName", sectionName);
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
            <FormField label="Name">
              <Input {...register("studentName")} />
            </FormField>
            <FormField label="Gender">
              <Select
                value={watch("gender")}
                onValueChange={(value) => setValue("gender", value as SdmsStudentForm["gender"])}
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
            <FormField label="Initialised at SDMS">
              <Select
                value={watch("initializedAtSdms") || "Yes"}
                onValueChange={(value) => setValue("initializedAtSdms", value)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yesNoOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Admission Number">
              <Input {...register("admissionNumber")} placeholder="School admission number" />
            </FormField>
            <FormField label="PEN Number">
              <Input {...register("studentPen")} placeholder="Student PEN" />
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
              <Select
                value={watch("bplBeneficiary") || "No"}
                onValueChange={(value) => setValue("bplBeneficiary", value)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yesNoOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="CWSN">
              <Select
                value={watch("cwsn") || "No"}
                onValueChange={(value) => setValue("cwsn", value)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yesNoOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Type of Impairments">
              <Input {...register("typeOfImpairments")} />
            </FormField>
            <FormField label="Is Repeater">
              <Select
                value={watch("isRepeater") || "No"}
                onValueChange={(value) => setValue("isRepeater", value)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yesNoOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Suspected Duplicate">
              <Select
                value={watch("suspectedDuplicate") || "No"}
                onValueChange={(value) => setValue("suspectedDuplicate", value)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yesNoOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
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
