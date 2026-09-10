"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bus, Plus, Pencil, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { transportRoutesApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";

type TransportRoute = {
  _id: string;
  name: string;
  monthlyFee: number;
};

export default function TransportRoutesPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");

  useEffect(() => {
    if (!isSuperAdmin) router.push("/dashboard");
  }, [isSuperAdmin, router]);

  const fetchRoutes = () =>
    transportRoutesApi.getAll().then((res) => setRoutes((res as { data: TransportRoute[] }).data));

  useEffect(() => {
    fetchRoutes();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter((route) => route.name.toLowerCase().includes(q));
  }, [routes, search]);

  const openCreate = () => {
    setEditId(null);
    setName("");
    setMonthlyFee("");
    setOpen(true);
  };

  const openEdit = (route: TransportRoute) => {
    setEditId(route._id);
    setName(route.name);
    setMonthlyFee(String(route.monthlyFee));
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Required", description: "Village / route name is required", variant: "destructive" });
      return;
    }
    const fee = Number(monthlyFee);
    if (Number.isNaN(fee) || fee < 0) {
      toast({ title: "Invalid fee", description: "Enter a valid monthly transport fee", variant: "destructive" });
      return;
    }

    try {
      if (editId) {
        await transportRoutesApi.update(editId, { name: name.trim(), monthlyFee: fee });
        toast({ title: "Updated", description: "Transport route updated" });
      } else {
        await transportRoutesApi.create({ name: name.trim(), monthlyFee: fee });
        toast({ title: "Created", description: "Transport route added" });
      }
      setOpen(false);
      fetchRoutes();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await transportRoutesApi.delete(id);
      toast({ title: "Deleted" });
      fetchRoutes();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Transport Routes"
        description="Village-wise monthly transport fees. Students select a route at registration; quarterly fees apply automatically."
        breadcrumbs={[{ label: "Transport Routes" }]}
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Route
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="pt-6">
          <SearchInput value={search} onChange={setSearch} placeholder="Search village / route..." />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Village / Route</TableHead>
                <TableHead>Monthly Fee</TableHead>
                <TableHead>Quarterly (Q1)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    <Bus className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    No transport routes yet.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((route) => (
                  <TableRow key={route._id}>
                    <TableCell className="font-medium">{route.name}</TableCell>
                    <TableCell>{formatCurrency(route.monthlyFee)}</TableCell>
                    <TableCell>{formatCurrency(route.monthlyFee * 2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(route)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(route._id)}>
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
            <DialogTitle>{editId ? "Edit Transport Route" : "Add Transport Route"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Village / Route Name" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nagla Sikandar" />
            </FormField>
            <FormField label="Monthly Fee (₹)" required>
              <Input
                type="number"
                min={0}
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                placeholder="e.g. 200"
              />
            </FormField>
            <Button onClick={handleSave} className="w-full">
              {editId ? "Update Route" : "Save Route"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
