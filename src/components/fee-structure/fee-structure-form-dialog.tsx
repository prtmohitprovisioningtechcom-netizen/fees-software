"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Check, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import {
  getNewStudentYearlyTotal,
  getOldStudentYearlyTotal,
  getYearlyTransport,
  TRANSPORT_MONTHS_BY_QUARTER,
  TRANSPORT_YEARLY_MONTHS,
  previewQuarterSchedule,
} from "@/lib/fee-schedule";
import { DEFAULT_FEE_POLICY, type FeePolicy } from "@/lib/fee-policy";
import { settingsApi } from "@/lib/api";
import {
  findPrefillSource,
  getClassesWithExistingStructure,
  type FeeStructureRecord,
  type SessionRecord,
} from "@/lib/fee-structure-prefill";

export interface FeeStructureFormData {
  classIds: string[];
  sessionId: string;
  admissionFee: number;
  monthlyFee: number;
  annualFee: number;
  computerFee: number;
  examFee: number;
  otherFee: number;
  transportFee: number;
  discount: number;
}

interface FeeStructureFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId: string | null;
  form: FeeStructureFormData;
  setForm: React.Dispatch<React.SetStateAction<FeeStructureFormData>>;
  classes: { _id: string; name: string }[];
  sessions: SessionRecord[];
  existingStructures: FeeStructureRecord[];
  onSave: () => void;
  saving?: boolean;
}

const FEE_ROWS: {
  key: keyof Pick<
    FeeStructureFormData,
    "admissionFee" | "monthlyFee" | "annualFee" | "computerFee" | "examFee" | "otherFee" | "transportFee" | "discount"
  >;
  label: string;
  note?: string;
  multiply?: number;
  quarterly?: boolean;
  isDiscount?: boolean;
}[] = [
  { key: "admissionFee", label: "Admission Pack", note: "New students — Prospectus + Reg + Admission" },
  { key: "monthlyFee", label: "Monthly Tuition", note: "Base fee per month", quarterly: true },
  { key: "annualFee", label: "Annual / Development", note: "Activity & development charges" },
  { key: "computerFee", label: "ID Card / Diary / Syllabus", note: "Stationery & documents" },
  { key: "examFee", label: "Exam Fee", note: "Yearly exam charges" },
  { key: "otherFee", label: "Form / Insurance (F.I.)", note: "One-time annual charges" },
  {
    key: "transportFee",
    label: "Monthly Transport",
    note: `11 months/year — Q1: ${TRANSPORT_MONTHS_BY_QUARTER[1]}mo, Q2–Q4: ${TRANSPORT_MONTHS_BY_QUARTER[2]}mo each (if student uses transport)`,
    quarterly: true,
  },
  { key: "discount", label: "Discount", note: "Applies to all students", isDiscount: true },
];

function StepHeader({
  step,
  title,
  subtitle,
  done,
  active,
}: {
  step: number;
  title: string;
  subtitle: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
          done && "bg-primary text-primary-foreground",
          active && !done && "bg-primary/15 text-primary ring-2 ring-primary/30",
          !done && !active && "bg-muted text-muted-foreground"
        )}
      >
        {done ? <Check className="h-4 w-4" /> : step}
      </span>
      <div>
        <p className={cn("text-sm font-semibold", !active && !done && "text-muted-foreground")}>{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function AmountInput({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (val: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
      <Input
        type="number"
        min={0}
        step={1}
        value={value || ""}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        placeholder="0"
        className="h-9 pl-7 text-right text-sm font-medium"
      />
    </div>
  );
}

export function FeeStructureFormDialog({
  open,
  onOpenChange,
  editId,
  form,
  setForm,
  classes,
  sessions,
  existingStructures,
  onSave,
  saving = false,
}: FeeStructureFormDialogProps) {
  const [prefillSource, setPrefillSource] = useState<string | null>(null);
  const [feePolicy, setFeePolicy] = useState<FeePolicy>(DEFAULT_FEE_POLICY);
  const [previewTransport, setPreviewTransport] = useState(true);
  const lastPrefillSessionRef = useRef<string | null>(null);

  const oldStudentTotal = getOldStudentYearlyTotal(form);
  const newStudentTotal = getNewStudentYearlyTotal(form);
  const totalFee = Math.max(0, oldStudentTotal - (form.discount || 0));

  const selectedSession = sessions.find((s) => s._id === form.sessionId)?.name;
  const existingForSession = form.sessionId
    ? getClassesWithExistingStructure(existingStructures, form.sessionId)
    : new Set<string>();

  const selectableClasses = editId
    ? classes.filter((c) => form.classIds.includes(c._id))
    : classes.filter((c) => !existingForSession.has(c._id));

  const step1Done = !!form.sessionId;
  const step2Done = form.classIds.length > 0;
  const step3Active = step1Done && step2Done;

  const toggleClass = (classId: string) => {
    if (editId) return;
    setForm((prev) => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter((id) => id !== classId)
        : [...prev.classIds, classId],
    }));
  };

  useEffect(() => {
    if (!open) {
      lastPrefillSessionRef.current = null;
      setPrefillSource(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    settingsApi.get().then((res) => {
      const data = (res as { data: { feePolicy?: FeePolicy } }).data;
      if (data.feePolicy) setFeePolicy(data.feePolicy);
    });
  }, [open]);

  useEffect(() => {
    if (editId || !open || !form.sessionId) return;
    if (lastPrefillSessionRef.current === form.sessionId) return;

    const result = findPrefillSource(existingStructures, sessions, form.sessionId, form.classIds);
    if (result) {
      setForm((prev) => ({ ...prev, ...result.fees }));
      setPrefillSource(result.source);
    }
    lastPrefillSessionRef.current = form.sessionId;
  }, [form.sessionId, editId, open, existingStructures, sessions, setForm]);

  useEffect(() => {
    if (editId || !open || !form.sessionId || form.classIds.length !== 1) return;

    const result = findPrefillSource(existingStructures, sessions, form.sessionId, form.classIds);
    if (result) {
      setForm((prev) => ({ ...prev, ...result.fees }));
      setPrefillSource(result.source);
    }
  }, [form.classIds, editId, open, form.sessionId, existingStructures, sessions, setForm]);

  const handleSessionChange = (sessionId: string) => {
    lastPrefillSessionRef.current = null;
    setPrefillSource(null);
    setForm((prev) => ({
      ...prev,
      sessionId,
      classIds: prev.classIds.filter((id) => !getClassesWithExistingStructure(existingStructures, sessionId).has(id)),
    }));
  };

  const quarterPreview = previewQuarterSchedule(
    {
      admissionFee: form.admissionFee,
      monthlyFee: form.monthlyFee,
      annualFee: form.annualFee,
      computerFee: form.computerFee,
      examFee: form.examFee,
      otherFee: form.otherFee,
      transportFee: form.transportFee,
    },
    feePolicy,
    true,
    previewTransport && form.transportFee > 0
  );

  const isValid = form.classIds.length > 0 && form.sessionId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b">
          <DialogTitle className="text-lg">
            {editId ? "Edit Fee Structure" : "Create Fee Structure"}
          </DialogTitle>
          {!editId && (
            <p className="text-sm text-muted-foreground font-normal">
              3 steps — session, class, fees. Amounts auto-fill from the previous session.
            </p>
          )}
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          {/* Step 1 — Session */}
          <section className={cn("rounded-lg border p-4", step1Done && "border-primary/25 bg-primary/[0.03]")}>
            <StepHeader
              step={1}
              title="Choose session"
              subtitle="Which academic session are you setting fees for?"
              done={step1Done}
              active={!step1Done}
            />
            <div className="mt-3">
              <Select value={form.sessionId} onValueChange={handleSessionChange} disabled={!!editId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a session..." />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {step1Done && selectedSession && (
                <p className="text-xs text-primary mt-2 flex items-center gap-1">
                  <Check className="h-3 w-3" /> {selectedSession} selected
                </p>
              )}
            </div>
          </section>

          {/* Step 2 — Classes */}
          <section
            className={cn(
              "rounded-lg border p-4 transition-opacity",
              !step1Done && "opacity-50 pointer-events-none",
              step2Done && step1Done && "border-primary/25 bg-primary/[0.03]"
            )}
          >
            <StepHeader
              step={2}
              title={editId ? "Class" : "Choose classes"}
              subtitle={editId ? "Edit mode — class cannot be changed" : "Select one or more classes by tapping"}
              done={step2Done}
              active={step1Done && !step2Done}
            />
            <div className="mt-3">
              {editId ? (
                <div className="rounded-md bg-muted px-3 py-2 text-sm font-medium">
                  {classes.find((c) => c._id === form.classIds[0])?.name}
                </div>
              ) : !step1Done ? (
                <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-md">
                  Select a session above first
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {classes.map((c) => {
                      const alreadySet = existingForSession.has(c._id);
                      const selected = form.classIds.includes(c._id);
                      return (
                        <button
                          key={c._id}
                          type="button"
                          disabled={alreadySet}
                          onClick={() => toggleClass(c._id)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                            alreadySet && "opacity-40 cursor-not-allowed line-through",
                            selected && !alreadySet && "border-primary bg-primary text-primary-foreground",
                            !selected && !alreadySet && "hover:border-primary/50 hover:bg-muted"
                          )}
                        >
                          {selected && <Check className="inline h-3 w-3 mr-1 -mt-0.5" />}
                          {c.name}
                          {alreadySet && " ✓"}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground">
                      {form.classIds.length} selected
                      {selectableClasses.length > 0 && ` / ${selectableClasses.length} available`}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setForm((prev) => ({ ...prev, classIds: selectableClasses.map((c) => c._id) }))}
                        disabled={selectableClasses.length === 0}
                      >
                        Select all
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setForm((prev) => ({ ...prev, classIds: [] }))}
                        disabled={form.classIds.length === 0}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Step 3 — Fees */}
          <section
            className={cn(
              "rounded-lg border p-4 transition-opacity",
              !step3Active && "opacity-50 pointer-events-none",
              step3Active && "border-primary/25"
            )}
          >
            <StepHeader
              step={3}
              title="Enter fees"
              subtitle="Change amounts as needed — everything else stays the same"
              done={false}
              active={step3Active}
            />

            {!step3Active ? (
              <p className="text-xs text-muted-foreground text-center py-4 mt-2 border border-dashed rounded-md">
                Fees will appear here after you select a session and classes
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {prefillSource && !editId && (
                  <p className="text-xs rounded-md bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200 px-3 py-2">
                    ↳ Prefilled from <strong>{prefillSource}</strong> — change only what you need
                  </p>
                )}

                <div className="rounded-md border divide-y">
                  {FEE_ROWS.map(({ key, label, note, quarterly, isDiscount }) => {
                    const amount = form[key];
                    return (
                      <div
                        key={key}
                        className={cn(
                          "flex items-center justify-between gap-3 px-3 py-2",
                          isDiscount && "bg-emerald-50/50 dark:bg-emerald-950/20"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{label}</p>
                          {note && <p className="text-[11px] text-muted-foreground">{note}</p>}
                          {quarterly && amount > 0 && key === "monthlyFee" && (
                            <p className="text-[11px] text-primary font-medium mt-0.5">
                              Quarterly (×3): {formatCurrency(amount * 3)} · Yearly (×12): {formatCurrency(amount * 12)}
                            </p>
                          )}
                          {key === "transportFee" && amount > 0 && (
                            <p className="text-[11px] text-primary font-medium mt-0.5">
                              Yearly (×{TRANSPORT_YEARLY_MONTHS}): {formatCurrency(getYearlyTransport(amount))} · Q1: {formatCurrency(amount * TRANSPORT_MONTHS_BY_QUARTER[1])} · Q2–Q4: {formatCurrency(amount * TRANSPORT_MONTHS_BY_QUARTER[2])} each
                            </p>
                          )}
                        </div>
                        <AmountInput
                          value={amount}
                          onChange={(val) => setForm({ ...form, [key]: val })}
                          className="w-28 shrink-0"
                        />
                      </div>
                    );
                  })}
                </div>

                {form.monthlyFee > 0 && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-primary">Quarterly collection preview</p>
                      {form.transportFee > 0 && (
                        <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={previewTransport}
                            onChange={(e) => setPreviewTransport(e.target.checked)}
                            className="rounded"
                          />
                          Include transport
                        </label>
                      )}
                    </div>
                    {quarterPreview.map((q) => (
                      <div key={q.quarter} className="border-t border-primary/10 pt-1.5 first:border-0 first:pt-0">
                        <p className="font-medium">{q.label} — {formatCurrency(q.totalDue)}</p>
                        <p className="text-muted-foreground">
                          {q.componentsDue.map((l) => `${l.label}: ${formatCurrency(l.amount)}`).join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-lg bg-muted/60 px-4 py-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Old student (yearly)</span>
                    <span className="font-semibold">{formatCurrency(oldStudentTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">New student (+ admission)</span>
                    <span className="font-semibold">{formatCurrency(newStudentTotal)}</span>
                  </div>
                  {form.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 text-xs">
                      <span>Discount</span>
                      <span>− {formatCurrency(form.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Net (old student)</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(totalFee)}</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="border-t px-5 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-muted/20">
          {!editId && step3Active && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />
              {form.classIds.length} class{form.classIds.length !== 1 ? "es" : ""} × {selectedSession} = {form.classIds.length} fee structure{form.classIds.length !== 1 ? "s" : ""} will be created
            </p>
          )}
          <div className="flex gap-2 sm:ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={!isValid || saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editId ? (
                "Update"
              ) : form.classIds.length > 1 ? (
                `Save for ${form.classIds.length} Classes`
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const emptyForm: FeeStructureFormData = {
  classIds: [],
  sessionId: "",
  admissionFee: 0,
  monthlyFee: 0,
  annualFee: 0,
  computerFee: 0,
  examFee: 0,
  otherFee: 0,
  transportFee: 0,
  discount: 0,
};

export { emptyForm };
