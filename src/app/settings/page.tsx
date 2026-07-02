"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Save, Shield, Upload, CalendarRange } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { settingsApi, usersApi } from "@/lib/api";
import { compressImageToDataUrl } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/components/ui/use-toast";
import { FeePolicyEditor } from "@/components/settings/fee-policy-editor";
import { SchoolHeader } from "@/components/shared/school-header";
import { useBranding } from "@/lib/branding-context";
import { parseSchoolBranding } from "@/lib/school-branding";
import { DEFAULT_FEE_POLICY, type FeePolicy } from "@/lib/fee-policy";

interface AppSettings {
  schoolName: string;
  appName: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  feePolicy?: FeePolicy;
}

interface UserOption {
  _id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin";
  isActive: boolean;
}

const emptySettings: AppSettings = {
  schoolName: "",
  appName: "",
  logo: "",
  address: "",
  phone: "",
  email: "",
  feePolicy: DEFAULT_FEE_POLICY,
};

export default function SettingsPage() {
  const router = useRouter();
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const { refresh: refreshBranding } = useBranding();
  const [settings, setSettings] = useState<AppSettings>(emptySettings);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) router.push("/dashboard");
  }, [authLoading, isSuperAdmin, router]);

  useEffect(() => {
    if (!isSuperAdmin) return;

    Promise.all([settingsApi.get(), usersApi.getPasswordTargets()])
      .then(([settingsRes, usersRes]) => {
        const settingsData = (settingsRes as { data: AppSettings }).data;
        const usersData = (usersRes as { data: UserOption[] }).data;
        setSettings({
          schoolName: settingsData.schoolName || "",
          appName: settingsData.appName || "",
          logo: settingsData.logo || "",
          address: settingsData.address || "",
          phone: settingsData.phone || "",
          email: settingsData.email || "",
          feePolicy: settingsData.feePolicy || DEFAULT_FEE_POLICY,
        });
        setUsers(usersData);
        setSelectedUserId(usersData[0]?._id || "");
      })
      .finally(() => setSettingsLoading(false));
  }, [isSuperAdmin]);

  const handleLogoChange = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid logo", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    try {
      const compressed = await compressImageToDataUrl(file);
      setSettings((prev) => ({ ...prev, logo: compressed }));
      toast({ title: "Logo ready", description: "Image compressed for upload." });
    } catch (error) {
      toast({
        title: "Logo too large",
        description: error instanceof Error ? error.message : "Could not process image",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = (await settingsApi.update(settings)) as { data: AppSettings; message: string };
      setSettings({
        schoolName: res.data.schoolName || "",
        appName: res.data.appName || "",
        logo: res.data.logo || "",
        address: res.data.address || "",
        phone: res.data.phone || "",
        email: res.data.email || "",
        feePolicy: res.data.feePolicy || DEFAULT_FEE_POLICY,
      });
      await refreshBranding();
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

  if (settingsLoading) {
    return (
      <DashboardLayout>
        <PageHeader title="Settings" description="Loading school settings..." breadcrumbs={[{ label: "Settings" }]} />
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <Card><CardContent className="pt-6 space-y-4"><Skeleton className="h-20 w-20" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent></Card>
          <Card><CardContent className="pt-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Settings"
        description="School branding, quarterly fee policy, and admin passwords."
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
                <Input placeholder="Enter app name" value={settings.appName} onChange={(event) => setSettings({ ...settings, appName: event.target.value })} />
              </FormField>
              <FormField label="School Name" required>
                <Input
                  placeholder="Enter full school name"
                  value={settings.schoolName}
                  onChange={(event) => setSettings({ ...settings, schoolName: event.target.value })}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Full name shown on sidebar, receipts, and prints.
                </p>
              </FormField>
              <FormField label="Phone">
                <Input placeholder="School contact number" value={settings.phone} onChange={(event) => setSettings({ ...settings, phone: event.target.value })} />
              </FormField>
              <FormField label="Email">
                <Input type="email" placeholder="school@example.com" value={settings.email} onChange={(event) => setSettings({ ...settings, email: event.target.value })} />
              </FormField>
              <FormField label="Address" className="md:col-span-2">
                <Textarea placeholder="Full school address" value={settings.address} onChange={(event) => setSettings({ ...settings, address: event.target.value })} />
              </FormField>
            </div>

            <Button onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Settings
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Preview</CardTitle>
              <p className="text-sm text-muted-foreground font-normal">
                This is how school name, address, phone and email appear on fee receipts and sidebar.
              </p>
            </CardHeader>
            <CardContent>
              <SchoolHeader
                branding={parseSchoolBranding(settings)}
                subtitle="Fee Payment Receipt"
                variant="preview"
                showLogo
              />
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
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5" />
            Quarterly Fee Policy
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Control which fee components are charged in each quarter. Changes apply to all classes and sessions.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.feePolicy && (
            <FeePolicyEditor
              policy={settings.feePolicy}
              onChange={(feePolicy) => setSettings((prev) => ({ ...prev, feePolicy }))}
            />
          )}
          <Button onClick={handleSaveSettings} disabled={savingSettings}>
            {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Fee Policy
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
