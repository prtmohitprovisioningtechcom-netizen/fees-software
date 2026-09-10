"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usersApi } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => { if (!isSuperAdmin) router.push("/dashboard"); }, [isSuperAdmin, router]);

  const fetchUsers = () => usersApi.getAll().then((res) => setUsers((res as { data: AdminUser[] }).data));
  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    try {
      await usersApi.create({ ...form, role: "admin" });
      toast({ title: "Created", description: "Admin user created" });
      setOpen(false);
      setForm({ name: "", email: "", password: "" });
      fetchUsers();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    }
  };

  const handleToggle = async (id: string) => {
    await usersApi.toggleStatus(id);
    fetchUsers();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await usersApi.delete(deleteId);
    toast({ title: "Deleted" });
    setDeleteId(null);
    fetchUsers();
  };

  return (
    <DashboardLayout>
      <PageHeader title="Admin Users" description="Manage admin accounts" breadcrumbs={[{ label: "Admin Users" }]}
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Admin</Button>} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u._id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell><Badge variant={u.isActive ? "success" : "secondary"}>{u.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleToggle(u._id)}>{u.isActive ? "Deactivate" : "Activate"}</Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(u._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Admin User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <FormField label="Name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
            <FormField label="Email" required><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
            <FormField label="Password" required><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></FormField>
            <Button onClick={handleCreate} className="w-full">Create Admin</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Admin?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
