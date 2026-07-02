"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { School, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/shared/form-field";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/components/ui/use-toast";
import { settingsApi } from "@/lib/api";
import { applySchoolFavicon, cacheSchoolFavicon, getCachedSchoolFavicon } from "@/lib/school-favicon";
import { getSchoolDisplayName, parseSchoolBranding } from "@/lib/school-branding";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState("");
  const [schoolTitle, setSchoolTitle] = useState("");

  useEffect(() => {
    settingsApi
      .getBranding()
      .then((res) => {
        const branding = parseSchoolBranding((res as { data?: { schoolName?: string; appName?: string; logo?: string } }).data);
        setLogo(branding.logo);
        setSchoolTitle(getSchoolDisplayName(branding));
        if (branding.logo) {
          applySchoolFavicon(branding.logo);
          cacheSchoolFavicon(branding.logo);
        }
      })
      .catch(() => {
        const cached = getCachedSchoolFavicon();
        if (cached) setLogo(cached);
      });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast({ title: "Welcome back!", description: "Login successful" });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
      <Card className="w-full max-w-md relative animate-fade-in shadow-2xl border-0">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary shadow-lg">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="School logo" className="h-full w-full object-cover" />
            ) : (
              <School className="h-8 w-8 text-primary-foreground" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">{schoolTitle || "Sign in"}</CardTitle>
            <CardDescription className="mt-2">Sign in to your account to continue</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Email" required error={errors.email?.message}>
              <Input type="email" placeholder="admin@school.com" {...register("email")} />
            </FormField>
            <FormField label="Password" required error={errors.password?.message}>
              <Input type="password" placeholder="••••••••" {...register("password")} />
            </FormField>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 rounded-lg bg-muted p-4 text-xs text-muted-foreground">
            <p className="font-medium mb-2">Demo Credentials:</p>
            <p>Super Admin: superadmin@school.com / admin123</p>
            <p>Admin: admin@school.com / admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
