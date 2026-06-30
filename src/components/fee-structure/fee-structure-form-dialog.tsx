"use client";

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
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface FeeStructureFormData {
  classId: string;
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
  sessions: { _id: string; name: string }[];
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
  onSave,
  saving = false,
}: FeeStructureFormDialogProps) {
  const monthlyAnnual = form.monthlyFee * 12;
  const oneTimeTotal =
    form.admissionFee + form.annualFee + form.computerFee + form.examFee + form.otherFee;
  const grossTotal = oneTimeTotal + monthlyAnnual;
  const totalFee = Math.max(0, grossTotal - (form.discount || 0));

  const selectedClass = classes.find((c) => c._id === form.classId)?.name;
  const selectedSession = sessions.find((s) => s._id === form.sessionId)?.name;

  const isValid = form.classId && form.sessionId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-primary/5 via-primary/10 to-transparent px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <IndianRupee className="h-5 w-5" />
              </div>
              {editId ? "Edit Fee Structure" : "Create Fee Structure"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground pt-1">
              Set annual fee components for a class. Total is calculated automatically.
            </p>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Class & Session */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Academic Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Class" required>
                <Select
                  value={form.classId}
                  onValueChange={(v) => setForm({ ...form, classId: v })}
                  disabled={!!editId}
                >
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
              </FormField>
              <FormField label="Academic Session" required>
                <Select
                  value={form.sessionId}
                  onValueChange={(v) => setForm({ ...form, sessionId: v })}
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
            </div>
            {selectedClass && selectedSession && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>
                  Fee structure for <strong>{selectedClass}</strong> — Session <strong>{selectedSession}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Fee Components */}
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

          {/* Summary */}
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

        {/* Footer */}
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
  classId: "",
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
