"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Save, Shield, Upload } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { settingsApi, usersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/components/ui/use-toast";

interface AppSettings {
  schoolName: string;
  appName: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
}

interface UserOption {
  _id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin";
  isActive: boolean;
}

const emptySettings: AppSettings = {
  schoolName: "School ERP",
  appName: "Fee Management",
  logo: "",
  address: "",
  phone: "",
  email: "",
};

export default function SettingsPage() {
  const router = useRouter();
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(emptySettings);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) router.push("/dashboard");
  }, [authLoading, isSuperAdmin, router]);

  useEffect(() => {
    if (!isSuperAdmin) return;

    Promise.all([settingsApi.get(), usersApi.getPasswordTargets()]).then(([settingsRes, usersRes]) => {
      const settingsData = (settingsRes as { data: AppSettings }).data;
      const usersData = (usersRes as { data: UserOption[] }).data;
      setSettings({ ...emptySettings, ...settingsData });
      setUsers(usersData);
      setSelectedUserId(usersData[0]?._id || "");
    });
  }, [isSuperAdmin]);

  const handleLogoChange = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid logo", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setSettings((prev) => ({ ...prev, logo: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = (await settingsApi.update(settings)) as { data: AppSettings; message: string };
      setSettings({ ...emptySettings, ...res.data });
      toast({ title: "Saved", description: "Settings updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to save settings", variant: "destructive" });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUserId) {
      toast({ title: "User required", description: "Please select a user.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setSavingPassword(true);
    try {
      await usersApi.changePassword(selectedUserId, newPassword);
      setNewPassword("");
      toast({ title: "Password changed", description: "Selected user's password has been updated." });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to change password", variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  if (!authLoading && !isSuperAdmin) return null;

  return (
    <DashboardLayout>
      <PageHeader
        title="Settings"
        description="Manage school branding and reset Super Admin/Admin passwords."
        breadcrumbs={[{ label: "Settings" }]}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Logo & School Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-muted overflow-hidden">
                {settings.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.logo} alt="School logo" className="h-full w-full object-cover" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <FormField label="Logo">
                  <Input type="file" accept="image/*" onChange={(event) => handleLogoChange(event.target.files?.[0])} />
                </FormField>
                {settings.logo && (
                  <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setSettings({ ...settings, logo: "" })}>
                    Remove logo
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="App Name" required>
                <Input value={settings.appName} onChange={(event) => setSettings({ ...settings, appName: event.target.value })} />
              </FormField>
              <FormField label="School Name" required>
                <Input value={settings.schoolName} onChange={(event) => setSettings({ ...settings, schoolName: event.target.value })} />
              </FormField>
              <FormField label="Phone">
                <Input value={settings.phone} onChange={(event) => setSettings({ ...settings, phone: event.target.value })} />
              </FormField>
              <FormField label="Email">
                <Input type="email" value={settings.email} onChange={(event) => setSettings({ ...settings, email: event.target.value })} />
              </FormField>
              <FormField label="Address" className="md:col-span-2">
                <Textarea value={settings.address} onChange={(event) => setSettings({ ...settings, address: event.target.value })} />
              </FormField>
            </div>

            <Button onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <FormField label="Select User" required>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Super Admin or Admin" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name} ({user.role.replace("_", " ")}) - {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="New Password" required>
              <div className="flex gap-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Minimum 6 characters"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </FormField>

            <Button onClick={handleChangePassword} disabled={savingPassword} className="w-full">
              {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Change Password
            </Button>

            <p className="text-xs text-muted-foreground">
              Super Admin can reset password for self and any active/inactive admin account.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
