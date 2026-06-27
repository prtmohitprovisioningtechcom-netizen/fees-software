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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { sessionsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";

export default function SessionsPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const [sessions, setSessions] = useState<{ _id: string; name: string; startDate: string; endDate: string; isCurrent: boolean }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", isCurrent: false });

  useEffect(() => { if (!isSuperAdmin) router.push("/dashboard"); }, [isSuperAdmin, router]);

  const fetch = () => sessionsApi.getAll().then((res) => setSessions((res as { data: typeof sessions }).data));
  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    try {
      await sessionsApi.create(form);
      toast({ title: "Created" });
      setOpen(false);
      fetch();
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Academic Sessions" breadcrumbs={[{ label: "Sessions" }]}
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Session</Button>} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Session</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s._id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{formatDate(s.startDate)}</TableCell>
                  <TableCell>{formatDate(s.endDate)}</TableCell>
                  <TableCell>{s.isCurrent && <Badge variant="success">Current</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={async () => { await sessionsApi.delete(s._id); fetch(); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Academic Session</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <FormField label="Session Name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="2025-26" /></FormField>
            <FormField label="Start Date" required><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></FormField>
            <FormField label="End Date" required><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></FormField>
            <FormField label="Set as Current">
              <Select value={form.isCurrent ? "true" : "false"} onValueChange={(v) => setForm({ ...form, isCurrent: v === "true" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="true">Yes</SelectItem><SelectItem value="false">No</SelectItem></SelectContent>
              </Select>
            </FormField>
            <Button onClick={handleCreate} className="w-full">Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
