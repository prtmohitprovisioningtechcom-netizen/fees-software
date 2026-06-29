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
import { classesApi } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";

export default function ClassesPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const [classes, setClasses] = useState<{ _id: string; name: string; description?: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!isSuperAdmin) router.push("/dashboard");
  }, [isSuperAdmin, router]);

  const fetchClasses = () => classesApi.getAll().then((res) => setClasses((res as { data: typeof classes }).data));
  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: "Required", description: "Class name is required", variant: "destructive" });
      return;
    }
    try {
      await classesApi.create({ name: name.trim() });
      toast({ title: "Created", description: "Class added successfully" });
      setOpen(false);
      setName("");
      fetchClasses();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    await classesApi.delete(id);
    toast({ title: "Deleted" });
    fetchClasses();
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Classes"
        description="Add classes manually or they are created automatically from student Excel import."
        breadcrumbs={[{ label: "Classes" }]}
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                    No classes yet. Add a class or upload students from Excel.
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c._id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Class Name" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Class 1" />
            </FormField>
            <Button onClick={handleCreate} className="w-full">Create Class</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
