"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExpenseCategory } from "@/types";

const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
] as const;

export type PaymentMode = (typeof PAYMENT_MODES)[number]["value"];

export interface ExpenseFormData {
  title: string;
  categoryId: string;
  amount: string;
  expenseDate: string;
  paymentMode: PaymentMode;
  paidTo: string;
}

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId: string | null;
  form: ExpenseFormData;
  setForm: React.Dispatch<React.SetStateAction<ExpenseFormData>>;
  categories: ExpenseCategory[];
  onSave: () => void;
  saving?: boolean;
}

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

export function ExpenseFormDialog({
  open,
  onOpenChange,
  editId,
  form,
  setForm,
  categories,
  onSave,
  saving = false,
}: ExpenseFormDialogProps) {
  const step1Done = !!form.categoryId;
  const step2Done = !!form.amount && Number(form.amount) > 0;
  const step3Active = step1Done && step2Done;

  const selectedCategory = categories.find((c) => c._id === form.categoryId)?.name;
  const isValid = form.categoryId && form.title.trim() && form.amount && Number(form.amount) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b">
          <DialogTitle>{editId ? "Edit Expense" : "Add Expense"}</DialogTitle>
          {!editId && (
            <p className="text-sm text-muted-foreground font-normal">
              Pick a category, enter amount, then add a short description.
            </p>
          )}
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          {/* Step 1 — Category */}
          <section className={cn("rounded-lg border p-4", step1Done && "border-primary/25 bg-primary/[0.03]")}>
            <StepHeader
              step={1}
              title="Choose category"
              subtitle="What type of expense is this?"
              done={step1Done}
              active={!step1Done}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-4 text-center">
                  Add a category on the expenses page first, then come back here.
                </p>
              ) : (
                categories.map((c) => {
                  const selected = form.categoryId === c._id;
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, categoryId: c._id }))}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "hover:border-primary/50 hover:bg-muted"
                      )}
                    >
                      {selected && <Check className="inline h-3 w-3 mr-1 -mt-0.5" />}
                      {c.name}
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Step 2 — Amount & Date */}
          <section
            className={cn(
              "rounded-lg border p-4 transition-opacity",
              !step1Done && "opacity-50 pointer-events-none",
              step2Done && step1Done && "border-primary/25 bg-primary/[0.03]"
            )}
          >
            <StepHeader
              step={2}
              title="Amount & date"
              subtitle="How much was spent and when?"
              done={step2Done}
              active={step1Done && !step2Done}
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    min={1}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0"
                    className="pl-8 h-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date</label>
                <Input
                  type="date"
                  value={form.expenseDate}
                  onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Payment mode</label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_MODES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, paymentMode: value })}
                    className={cn(
                      "rounded-md border px-3 py-1 text-xs font-medium",
                      form.paymentMode === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Step 3 — Details */}
          <section
            className={cn(
              "rounded-lg border p-4 transition-opacity",
              !step3Active && "opacity-50 pointer-events-none"
            )}
          >
            <StepHeader
              step={3}
              title="Description"
              subtitle="Short note about this expense"
              done={false}
              active={step3Active}
            />
            {!step3Active ? (
              <p className="text-xs text-muted-foreground text-center py-3 mt-2 border border-dashed rounded-md">
                Select category and amount first
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    What was this for? <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder={`e.g. ${selectedCategory} — March bill`}
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Paid to (optional)</label>
                  <Input
                    value={form.paidTo}
                    onChange={(e) => setForm({ ...form, paidTo: e.target.value })}
                    placeholder="Vendor or person name"
                    className="h-10"
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="border-t px-5 py-4 flex justify-end gap-2 bg-muted/20">
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
            ) : (
              "Save Expense"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const emptyExpenseForm = (): ExpenseFormData => ({
  title: "",
  categoryId: "",
  amount: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  paymentMode: "cash",
  paidTo: "",
});
