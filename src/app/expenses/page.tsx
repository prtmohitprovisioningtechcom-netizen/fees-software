"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Pencil, Trash2, Wallet, CalendarDays, Tag } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { expensesApi } from "@/lib/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { Expense, ExpenseCategory, ExpenseStats } from "@/types";
import {
  ExpenseFormDialog,
  emptyExpenseForm,
  type ExpenseFormData,
} from "@/components/expenses/expense-form-dialog";

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export default function ExpensesPage() {
  const monthRange = useMemo(() => getMonthRange(), []);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [showAllTime, setShowAllTime] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseFormData>(emptyExpenseForm());
  const [newCategory, setNewCategory] = useState("");

  const fetchCategories = () =>
    expensesApi.getCategories().then((res) => setCategories((res as { data: ExpenseCategory[] }).data));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: "15",
      };
      if (search.trim()) params.search = search.trim();
      if (activeCategory) params.categoryId = activeCategory;
      if (!showAllTime) {
        params.startDate = monthRange.startDate;
        params.endDate = monthRange.endDate;
      }

      const statsParams: Record<string, string> = showAllTime ? {} : { ...monthRange };

      const [listRes, statsRes] = await Promise.all([
        expensesApi.getAll(params),
        expensesApi.getStats(statsParams),
      ]);

      const list = listRes as { data: Expense[]; pagination: typeof pagination };
      setExpenses(list.data);
      setPagination(list.pagination);
      setStats((statsRes as { data: ExpenseStats }).data);
    } finally {
      setLoading(false);
    }
  }, [page, search, activeCategory, showAllTime, monthRange]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchData, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    stats?.byCategory?.forEach((item) => {
      if (item.categoryId) map.set(item.categoryId, item.total);
    });
    return map;
  }, [stats]);

  const openCreate = (categoryId?: string) => {
    setEditId(null);
    setForm({ ...emptyExpenseForm(), categoryId: categoryId || "" });
    setOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditId(expense._id);
    setForm({
      title: expense.title,
      categoryId: expense.categoryId._id,
      amount: String(expense.amount),
      expenseDate: expense.expenseDate.slice(0, 10),
      paymentMode: expense.paymentMode as ExpenseFormData["paymentMode"],
      paidTo: expense.paidTo || "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.categoryId || !form.amount) {
      toast({ title: "Required", description: "Category, amount and description are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        categoryId: form.categoryId,
        amount: Number(form.amount),
        expenseDate: form.expenseDate,
        paymentMode: form.paymentMode,
        paidTo: form.paidTo || undefined,
      };
      if (editId) {
        await expensesApi.update(editId, payload);
        toast({ title: "Updated", description: "Expense updated" });
      } else {
        await expensesApi.create(payload);
        toast({ title: "Saved", description: "Expense recorded" });
      }
      setOpen(false);
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await expensesApi.delete(deleteId);
      toast({ title: "Deleted", description: "Expense removed" });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    }
    setDeleteId(null);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const res = await expensesApi.createCategory(newCategory.trim());
      const created = (res as { data: ExpenseCategory }).data;
      toast({ title: "Category added" });
      setNewCategory("");
      await fetchCategories();
      if (created?._id) setActiveCategory(created._id);
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    }
  };

  const periodLabel = showAllTime ? "All time" : "This month";

  return (
    <DashboardLayout>
      <PageHeader
        title="Expenses"
        description="Add your own categories, then track spending under each one."
        breadcrumbs={[{ label: "Expenses" }]}
        action={
          <Button
            onClick={() => openCreate(activeCategory || undefined)}
            disabled={categories.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3 mb-5">
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5" /> Today
          </p>
          <p className="text-xl font-bold text-amber-700 mt-1">{formatCurrency(stats?.todayTotal ?? 0)}</p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> This month
          </p>
          <p className="text-xl font-bold text-amber-700 mt-1">{formatCurrency(stats?.monthTotal ?? 0)}</p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Tag className="h-3.5 w-3.5" /> {activeCategory ? "Category total" : periodLabel}
          </p>
          <p className="text-xl font-bold mt-1">
            {formatCurrency(activeCategory ? categoryTotals.get(activeCategory) ?? 0 : stats?.rangeTotal ?? 0)}
          </p>
        </div>
      </div>

      {/* Category-wise */}
      <Card className="mb-5">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-sm font-semibold">Your categories — {periodLabel}</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => { setShowAllTime(!showAllTime); setPage(1); }}
            >
              {showAllTime ? "Show this month" : "Show all time"}
            </Button>
          </div>

          <div className="flex gap-2 mb-4">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category — e.g. Salary, Rent, Stationery"
              className="h-9"
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            />
            <Button size="sm" className="shrink-0" onClick={handleAddCategory}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
              No categories yet. Create one above — e.g. Salary, Utilities, Transport.
            </p>
          ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setActiveCategory(""); setPage(1); }}
              className={cn(
                "rounded-lg border px-3 py-2 text-left min-w-[100px] transition-colors",
                !activeCategory ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted"
              )}
            >
              <p className="text-xs text-muted-foreground">All</p>
              <p className="text-sm font-semibold">{formatCurrency(stats?.rangeTotal ?? 0)}</p>
            </button>
            {categories.map((cat) => {
              const total = categoryTotals.get(cat._id) ?? 0;
              const selected = activeCategory === cat._id;
              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => { setActiveCategory(cat._id); setPage(1); }}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left min-w-[100px] transition-colors",
                    selected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted"
                  )}
                >
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">{cat.name}</p>
                  <p className="text-sm font-semibold text-amber-700">{formatCurrency(total)}</p>
                </button>
              );
            })}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search description or vendor..."
        />
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Paid to</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <p className="text-muted-foreground">No expenses found</p>
                    <Button variant="link" className="mt-1" onClick={() => openCreate(activeCategory || undefined)}>
                      Add your first expense
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense._id}>
                    <TableCell className="text-sm">{formatDate(expense.expenseDate)}</TableCell>
                    <TableCell>
                      <span className="text-xs font-medium rounded-full bg-muted px-2 py-0.5">
                        {expense.categoryId?.name}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{expense.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{expense.paidTo || "—"}</TableCell>
                    <TableCell className="text-sm capitalize">{expense.paymentMode.replace("_", " ")}</TableCell>
                    <TableCell className="text-right font-semibold text-amber-700">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(expense)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(expense._id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!loading && expenses.length > 0 && (
            <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />
          )}
        </CardContent>
      </Card>

      <ExpenseFormDialog
        open={open}
        onOpenChange={setOpen}
        editId={editId}
        form={form}
        setForm={setForm}
        categories={categories}
        onSave={handleSave}
        saving={saving}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the expense from your records.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
