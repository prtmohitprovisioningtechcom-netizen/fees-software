"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Wallet, TrendingDown, CalendarDays, Tag } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { StatCard } from "@/components/shared/stat-card";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { expensesApi, sessionsApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Expense, ExpenseCategory, ExpenseStats } from "@/types";

const PAYMENT_MODES = ["cash", "upi", "card", "cheque", "bank_transfer"] as const;

const emptyForm = {
  title: "",
  categoryId: "",
  amount: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  paymentMode: "cash" as (typeof PAYMENT_MODES)[number],
  paidTo: "",
  sessionId: "",
  remarks: "",
};

export default function ExpensesPage() {
  const { isSuperAdmin } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [sessions, setSessions] = useState<{ _id: string; name: string }[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    categoryId: "",
    sessionId: "",
    paymentMode: "",
    startDate: "",
    endDate: "",
  });
  const [open, setOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
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
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.sessionId) params.sessionId = filters.sessionId;
      if (filters.paymentMode) params.paymentMode = filters.paymentMode;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const statsParams: Record<string, string> = {};
      if (filters.sessionId) statsParams.sessionId = filters.sessionId;
      if (filters.startDate) statsParams.startDate = filters.startDate;
      if (filters.endDate) statsParams.endDate = filters.endDate;

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
  }, [page, search, filters]);

  useEffect(() => {
    fetchCategories();
    sessionsApi.getAll().then((res) => setSessions((res as { data: typeof sessions }).data));
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchData, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditId(expense._id);
    setForm({
      title: expense.title,
      categoryId: expense.categoryId._id,
      amount: String(expense.amount),
      expenseDate: expense.expenseDate.slice(0, 10),
      paymentMode: expense.paymentMode as (typeof PAYMENT_MODES)[number],
      paidTo: expense.paidTo || "",
      sessionId: expense.sessionId?._id || "",
      remarks: expense.remarks || "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.categoryId || !form.amount) {
      toast({ title: "Required", description: "Title, category and amount are required", variant: "destructive" });
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
        sessionId: form.sessionId || undefined,
        remarks: form.remarks || undefined,
      };
      if (editId) {
        await expensesApi.update(editId, payload);
        toast({ title: "Updated", description: "Expense updated successfully" });
      } else {
        await expensesApi.create(payload);
        toast({ title: "Recorded", description: "Expense added successfully" });
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
      await expensesApi.createCategory(newCategory.trim());
      toast({ title: "Category added" });
      setNewCategory("");
      fetchCategories();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await expensesApi.deleteCategory(id);
      toast({ title: "Category removed" });
      fetchCategories();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Expenses"
        description="Record school expenses with category, date, and payment mode."
        breadcrumbs={[{ label: "Expenses" }]}
        action={
          <div className="flex gap-2">
            {isSuperAdmin && (
              <Button variant="outline" onClick={() => setCategoryOpen(true)}>
                <Tag className="h-4 w-4 mr-2" />
                Categories
              </Button>
            )}
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Today's Expense" value={stats?.todayTotal ?? 0} icon={Wallet} loading={loading} variant="warning" />
        <StatCard title="This Month" value={stats?.monthTotal ?? 0} icon={CalendarDays} loading={loading} variant="warning" />
        <StatCard
          title="Filtered Total"
          value={stats?.rangeTotal ?? 0}
          icon={TrendingDown}
          loading={loading}
          variant="warning"
        />
        <StatCard title="Expense Count" value={stats?.rangeCount ?? 0} icon={Tag} loading={loading} />
      </div>

      {stats?.byCategory && stats.byCategory.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Category-wise Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {stats.byCategory.map((item) => (
                <div key={item.categoryId} className="flex justify-between rounded-lg border px-3 py-2 text-sm">
                  <span className="text-muted-foreground">{item.categoryName}</span>
                  <span className="font-semibold text-amber-700">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search title, vendor, voucher..."
            />
            <Select value={filters.categoryId} onValueChange={(v) => { setFilters({ ...filters, categoryId: v === "all" ? "" : v }); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.sessionId} onValueChange={(v) => { setFilters({ ...filters, sessionId: v === "all" ? "" : v }); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="All Sessions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.paymentMode} onValueChange={(v) => { setFilters({ ...filters, paymentMode: v === "all" ? "" : v }); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Payment Mode" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                {PAYMENT_MODES.map((m) => <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={filters.startDate} onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setPage(1); }} />
            <Input type="date" value={filters.endDate} onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setPage(1); }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Voucher</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Paid To</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No expenses found</TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense._id}>
                    <TableCell className="font-mono text-xs">{expense.voucherNumber}</TableCell>
                    <TableCell className="font-medium">{expense.title}</TableCell>
                    <TableCell><Badge variant="secondary">{expense.categoryId?.name}</Badge></TableCell>
                    <TableCell>{expense.paidTo || "—"}</TableCell>
                    <TableCell>{formatDate(expense.expenseDate)}</TableCell>
                    <TableCell className="capitalize">{expense.paymentMode.replace("_", " ")}</TableCell>
                    <TableCell className="text-right font-semibold text-amber-700">{formatCurrency(expense.amount)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(expense)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(expense._id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Expense" : "Add Expense"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <FormField label="Title" required>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Electricity Bill" />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Category" required>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Amount (₹)" required>
                <Input type="number" min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Expense Date" required>
                <Input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
              </FormField>
              <FormField label="Payment Mode" required>
                <Select value={form.paymentMode} onValueChange={(v) => setForm({ ...form, paymentMode: v as typeof form.paymentMode })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((m) => <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField label="Paid To / Vendor">
              <Input value={form.paidTo} onChange={(e) => setForm({ ...form, paidTo: e.target.value })} placeholder="Person or company name" />
            </FormField>
            <FormField label="Academic Session (optional)">
              <Select value={form.sessionId || "none"} onValueChange={(v) => setForm({ ...form, sessionId: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not linked to session</SelectItem>
                  {sessions.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Remarks">
              <Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional notes" />
            </FormField>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : editId ? "Update Expense" : "Save Expense"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expense Categories</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name" />
              <Button onClick={handleAddCategory}>Add</Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map((c) => (
                <div key={c._id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span>{c.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(c._id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>This expense will be removed from records.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
