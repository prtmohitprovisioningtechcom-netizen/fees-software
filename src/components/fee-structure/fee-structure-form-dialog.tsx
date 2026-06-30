"use client";

import { useEffect, useRef, useState } from "react";
import {
  IndianRupee,
  GraduationCap,
  Calendar,
  Monitor,
  FileText,
  CircleDollarSign,
  Loader2,
  BookOpen,
  CalendarDays,
  Info,
  CheckSquare,
  Square,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import {
  findPrefillSource,
  getClassesWithExistingStructure,
  type FeeStructureRecord,
  type SessionRecord,
} from "@/lib/fee-structure-prefill";
import { LucideIcon } from "lucide-react";

export interface FeeStructureFormData {
  classIds: string[];
  sessionId: string;
  admissionFee: number;
  monthlyFee: number;
  annualFee: number;
  computerFee: number;
  examFee: number;
  otherFee: number;
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

const FEE_FIELDS: {
  key: keyof Pick<
    FeeStructureFormData,
    "admissionFee" | "monthlyFee" | "annualFee" | "computerFee" | "examFee" | "otherFee" | "discount"
  >;
  label: string;
  hint: string;
  icon: LucideIcon;
  color: string;
  multiply?: number;
  isDiscount?: boolean;
}[] = [
  {
    key: "admissionFee",
    label: "Admission Fee",
    hint: "One-time at admission",
    icon: GraduationCap,
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    key: "monthlyFee",
    label: "Monthly Fee",
    hint: "Per month × 12 months",
    icon: Calendar,
    color: "bg-violet-500/10 text-violet-600",
    multiply: 12,
  },
  {
    key: "annualFee",
    label: "Annual Fee",
    hint: "Yearly fee (lump sum)",
    icon: CalendarDays,
    color: "bg-indigo-500/10 text-indigo-600",
  },
  {
    key: "computerFee",
    label: "Computer Fee",
    hint: "Annual charge",
    icon: Monitor,
    color: "bg-cyan-500/10 text-cyan-600",
  },
  {
    key: "examFee",
    label: "Exam Fee",
    hint: "Annual charge",
    icon: FileText,
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    key: "otherFee",
    label: "Other Fee",
    hint: "Miscellaneous annual",
    icon: CircleDollarSign,
    color: "bg-rose-500/10 text-rose-600",
  },
  {
    key: "discount",
    label: "Default Discount",
    hint: "Class-wide discount (₹) for all students",
    icon: IndianRupee,
    color: "bg-emerald-500/10 text-emerald-600",
    isDiscount: true,
  },
];

function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
}: {
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">₹</span>
      <Input
        type="number"
        min={0}
        step={1}
        value={value || ""}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        placeholder={placeholder}
        className="pl-8 h-11 text-base font-medium"
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
  const lastPrefillSessionRef = useRef<string | null>(null);

  const monthlyAnnual = form.monthlyFee * 12;
  const oneTimeTotal =
    form.admissionFee + form.annualFee + form.computerFee + form.examFee + form.otherFee;
  const grossTotal = oneTimeTotal + monthlyAnnual;
  const totalFee = Math.max(0, grossTotal - (form.discount || 0));

  const selectedSession = sessions.find((s) => s._id === form.sessionId)?.name;
  const existingForSession = form.sessionId
    ? getClassesWithExistingStructure(existingStructures, form.sessionId)
    : new Set<string>();

  const selectableClasses = editId
    ? classes.filter((c) => form.classIds.includes(c._id))
    : classes.filter((c) => !existingForSession.has(c._id));

  const toggleClass = (classId: string) => {
    if (editId) return;
    setForm((prev) => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter((id) => id !== classId)
        : [...prev.classIds, classId],
    }));
  };

  const selectAllClasses = () => {
    setForm((prev) => ({ ...prev, classIds: selectableClasses.map((c) => c._id) }));
  };

  const clearClasses = () => {
    setForm((prev) => ({ ...prev, classIds: [] }));
  };

  useEffect(() => {
    if (!open) {
      lastPrefillSessionRef.current = null;
      setPrefillSource(null);
    }
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

  const selectedClassNames = classes
    .filter((c) => form.classIds.includes(c._id))
    .map((c) => c.name);

  const isValid = form.classIds.length > 0 && form.sessionId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="border-b bg-gradient-to-r from-primary/5 via-primary/10 to-transparent px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <IndianRupee className="h-5 w-5" />
              </div>
              {editId ? "Edit Fee Structure" : "Create Fee Structure"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground pt-1">
              {editId
                ? "Update fee components for this class and session."
                : "Select one or more classes. Fees auto-fill from the previous session — change only what you need."}
            </p>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Academic Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Academic Session" required className="sm:col-span-2 sm:order-1">
                <Select
                  value={form.sessionId}
                  onValueChange={handleSessionChange}
                  disabled={!!editId}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <div className="sm:col-span-2 sm:order-2">
                <FormField label={editId ? "Class" : "Classes"} required>
                  {editId ? (
                    <Select value={form.classIds[0] || ""} disabled>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          {form.classIds.length} of {selectableClasses.length} class
                          {selectableClasses.length !== 1 ? "es" : ""} selected
                        </p>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={selectAllClasses}
                            disabled={!form.sessionId || selectableClasses.length === 0}
                          >
                            Select All
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={clearClasses}
                            disabled={form.classIds.length === 0}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      {!form.sessionId ? (
                        <p className="text-sm text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center">
                          Select a session first to choose classes
                        </p>
                      ) : (
                        <div className="max-h-44 overflow-y-auto rounded-lg border divide-y">
                          {classes.map((c) => {
                            const alreadySet = existingForSession.has(c._id);
                            const selected = form.classIds.includes(c._id);
                            return (
                              <label
                                key={c._id}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors",
                                  alreadySet && "opacity-50 cursor-not-allowed hover:bg-transparent",
                                  selected && !alreadySet && "bg-primary/5"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={selected}
                                  disabled={alreadySet}
                                  onChange={() => toggleClass(c._id)}
                                />
                                {selected ? (
                                  <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                                ) : (
                                  <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                                <span className="text-sm font-medium flex-1">{c.name}</span>
                                {alreadySet && (
                                  <Badge variant="secondary" className="text-xs">
                                    Already set
                                  </Badge>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </FormField>
              </div>
            </div>

            {prefillSource && !editId && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900 px-3 py-2 text-sm">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Fees prefilled from <strong>{prefillSource}</strong>. Change only what you need.
                </span>
              </div>
            )}

            {selectedClassNames.length > 0 && selectedSession && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>
                  {editId ? (
                    <>
                      Fee structure for <strong>{selectedClassNames[0]}</strong> — Session{" "}
                      <strong>{selectedSession}</strong>
                    </>
                  ) : (
                    <>
                      Creating for <strong>{selectedClassNames.join(", ")}</strong> — Session{" "}
                      <strong>{selectedSession}</strong>
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-primary" />
              Fee Components
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {FEE_FIELDS.map(({ key, label, hint, icon: Icon, color, multiply, isDiscount }) => {
                const amount = form[key];
                const annualAmount = multiply ? amount * multiply : amount;

                return (
                  <div
                    key={key}
                    className={cn(
                      "rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm",
                      isDiscount && "sm:col-span-2 border-emerald-200"
                    )}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-tight">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
                      </div>
                    </div>
                    <CurrencyInput
                      value={amount}
                      onChange={(val) => setForm({ ...form, [key]: val })}
                    />
                    {multiply && amount > 0 && (
                      <p className="text-xs text-muted-foreground mt-2 text-right">
                        {formatCurrency(amount)} × 12 ={" "}
                        <span className="font-medium text-foreground">{formatCurrency(annualAmount)}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5">
            <p className="text-sm font-medium text-muted-foreground mb-3">Fee Summary (Auto Calculated)</p>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">One-time & Annual Fees</span>
                <span className="font-medium">{formatCurrency(oneTimeTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Fee (×12)</span>
                <span className="font-medium">{formatCurrency(monthlyAnnual)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Total</span>
                <span className="font-medium">{formatCurrency(grossTotal)}</span>
              </div>
              {form.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Default Discount</span>
                  <span className="font-medium">− {formatCurrency(form.discount)}</span>
                </div>
              )}
              <div className="border-t border-primary/20 pt-2 flex justify-between items-center">
                <span className="font-semibold">Net Annual Fee (after discount)</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(totalFee)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t bg-muted/30 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!isValid || saving} className="min-w-[160px]">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : editId ? (
              "Update Fee Structure"
            ) : form.classIds.length > 1 ? (
              `Create for ${form.classIds.length} Classes`
            ) : (
              "Create Fee Structure"
            )}
          </Button>
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
  discount: 0,
};

export { emptyForm };
