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
import { sectionsApi, classesApi } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";

export default function SectionsPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const [sections, setSections] = useState<{ _id: string; name: string; classId: { name: string } }[]>([]);
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", classId: "" });

  useEffect(() => { if (!isSuperAdmin) router.push("/dashboard"); }, [isSuperAdmin, router]);

  const fetch = () => {
    sectionsApi.getAll().then((res) => setSections((res as { data: typeof sections }).data));
    classesApi.getAll().then((res) => setClasses((res as { data: typeof classes }).data));
  };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    try {
      await sectionsApi.create(form);
      toast({ title: "Created" });
      setOpen(false);
      fetch();
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Sections" breadcrumbs={[{ label: "Sections" }]}
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Section</Button>} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Class</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {sections.map((s) => (
                <TableRow key={s._id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.classId?.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={async () => { await sectionsApi.delete(s._id); fetch(); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Section</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <FormField label="Class" required>
              <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Section Name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. A" /></FormField>
            <Button onClick={handleCreate} className="w-full">Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
