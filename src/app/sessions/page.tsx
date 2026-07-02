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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { sessionsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";

type SessionRow = {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

export default function SessionsPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", isCurrent: false });

  useEffect(() => {
    if (!isSuperAdmin) router.push("/dashboard");
  }, [isSuperAdmin, router]);

  const fetchSessions = () =>
    sessionsApi
      .getAll()
      .then((res) => setSessions((res as { data: SessionRow[] }).data))
      .catch((error) => {
        toast({
          title: "Could not load sessions",
          description: error instanceof Error ? error.message : "Failed to load sessions",
          variant: "destructive",
        });
      });

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      toast({ title: "Required", description: "Session name, start date and end date are required", variant: "destructive" });
      return;
    }
    try {
      await sessionsApi.create({
        name: form.name.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        isCurrent: form.isCurrent,
      });
      toast({ title: "Created", description: "Academic session added" });
      setOpen(false);
      setForm({ name: "", startDate: "", endDate: "", isCurrent: false });
      fetchSessions();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create session",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await sessionsApi.delete(deleteId);
      toast({ title: "Deleted", description: "Session removed" });
      fetchSessions();
    } catch (error) {
      toast({
        title: "Could not delete session",
        description: error instanceof Error ? error.message : "Failed to delete session",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Academic Sessions"
        breadcrumbs={[{ label: "Sessions" }]}
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Session
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s._id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{formatDate(s.startDate)}</TableCell>
                  <TableCell>{formatDate(s.endDate)}</TableCell>
                  <TableCell>{s.isCurrent && <Badge variant="success">Current</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(String(s._id))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Academic Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Session Name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. 2026-27"
              />
            </FormField>
            <FormField label="Start Date" required>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </FormField>
            <FormField label="End Date" required>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </FormField>
            <FormField label="Set as Current">
              <Select
                value={form.isCurrent ? "true" : "false"}
                onValueChange={(v) => setForm({ ...form, isCurrent: v === "true" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <Button onClick={handleCreate} className="w-full">
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the session only if it has no students, fee structures, or payments linked to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
