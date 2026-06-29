"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, IndianRupee, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { feeStructuresApi, classesApi, sessionsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FeeStructureFormDialog,
  FeeStructureFormData,
  emptyForm,
} from "@/components/fee-structure/fee-structure-form-dialog";

interface FeeStructure {
  _id: string;
  classId: { _id: string; name: string };
  sessionId: { _id: string; name: string };
  admissionFee: number;
  monthlyFee: number;
  computerFee: number;
  examFee: number;
  otherFee: number;
  totalFee: number;
}

export default function FeeStructurePage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);
  const [sessions, setSessions] = useState<{ _id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FeeStructureFormData>(emptyForm);

  useEffect(() => {
    if (!isSuperAdmin) router.push("/dashboard");
  }, [isSuperAdmin, router]);

  const fetchData = () => {
    feeStructuresApi.getAll().then((res) => setStructures((res as { data: FeeStructure[] }).data));
    classesApi.getAll().then((res) => setClasses((res as { data: typeof classes }).data));
    sessionsApi.getAll().then((res) => setSessions((res as { data: typeof sessions }).data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.classId || !form.sessionId) {
      toast({ title: "Required", description: "Please select class and session", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await feeStructuresApi.update(editId, form);
        toast({ title: "Updated", description: "Fee structure updated successfully" });
      } else {
        await feeStructuresApi.create(form);
        toast({ title: "Created", description: "Fee structure created successfully" });
      }
      setOpen(false);
      setEditId(null);
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (s: FeeStructure) => {
    setEditId(s._id);
    setForm({
      classId: s.classId._id,
      sessionId: s.sessionId._id,
      admissionFee: s.admissionFee,
      monthlyFee: s.monthlyFee,
      computerFee: s.computerFee,
      examFee: s.examFee,
      otherFee: s.otherFee,
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await feeStructuresApi.delete(deleteId);
      toast({ title: "Deleted", description: "Fee structure removed" });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
    setDeleteId(null);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Fee Structure"
        description="Manage fee structures for each class and session"
        breadcrumbs={[{ label: "Fee Structure" }]}
        action={
          <Button onClick={openCreate} size="lg" className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Fee Structure
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {structures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Layers className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No fee structures yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Create fee structures for each class. Define admission, monthly, and other fees in one place.
              </p>
              <Button onClick={openCreate} className="mt-6">
                <Plus className="h-4 w-4 mr-2" />
                Create First Fee Structure
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Class</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Admission</TableHead>
                    <TableHead>Monthly</TableHead>
                    <TableHead>Computer</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Other</TableHead>
                    <TableHead>Total Annual</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {structures.map((s) => (
                    <TableRow key={s._id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{s.classId?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{s.sessionId?.name}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(s.admissionFee)}</TableCell>
                      <TableCell>{formatCurrency(s.monthlyFee)}</TableCell>
                      <TableCell>{formatCurrency(s.computerFee)}</TableCell>
                      <TableCell>{formatCurrency(s.examFee)}</TableCell>
                      <TableCell>{formatCurrency(s.otherFee)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 font-bold text-primary">
                          <IndianRupee className="h-3.5 w-3.5" />
                          {formatCurrency(s.totalFee).replace("₹", "")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(s)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(s._id)} title="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <FeeStructureFormDialog
        open={open}
        onOpenChange={setOpen}
        editId={editId}
        form={form}
        setForm={setForm}
        classes={classes}
        sessions={sessions}
        onSave={handleSave}
        saving={saving}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fee Structure?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. Existing payments will not be affected.</AlertDialogDescription>
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
