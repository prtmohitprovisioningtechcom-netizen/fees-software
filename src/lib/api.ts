// Browser: always same-origin /api (works on Vercel + localhost)
// Server: full URL for local custom server
const API_URL =
  typeof window !== "undefined"
    ? "/api"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

interface FetchOptions extends RequestInit {
  token?: string;
  skipAuth?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, skipAuth, headers, ...rest } = options;

  const authToken = skipAuth
    ? null
    : token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  const hasBody = rest.body != null && rest.body !== "";
  const requestHeaders: Record<string, string> = {
    ...(hasBody && !(rest.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(headers as Record<string, string> | undefined),
  };

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...rest,
      headers: requestHeaders,
    });
  } catch (error) {
    const isNetworkError = error instanceof TypeError;
    throw new Error(
      isNetworkError
        ? "Cannot reach server. Run npm run dev and refresh the page."
        : error instanceof Error
          ? error.message
          : "Network error"
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      res.status === 413
        ? "Upload too large. Use a smaller logo image or save without changing the logo."
        : (data as { message?: string }).message || "Something went wrong";
    throw new Error(message);
  }

  return data;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  getProfile: () => apiClient("/auth/profile"),
};

export const usersApi = {
  getAll: () => apiClient("/users"),
  getPasswordTargets: () => apiClient("/users/password-targets"),
  create: (data: object) => apiClient("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: object) => apiClient(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiClient(`/users/${id}`, { method: "DELETE" }),
  toggleStatus: (id: string) => apiClient(`/users/${id}/toggle-status`, { method: "PATCH" }),
  changePassword: (id: string, password: string) =>
    apiClient(`/users/${id}/password`, { method: "PATCH", body: JSON.stringify({ password }) }),
};

export const settingsApi = {
  get: () => apiClient("/settings"),
  getBranding: () => apiClient("/settings/branding", { skipAuth: true }),
  update: (data: object) => apiClient("/settings", { method: "PUT", body: JSON.stringify(data) }),
};

export const classesApi = {
  getAll: () => apiClient("/classes"),
  create: (data: object) => apiClient("/classes", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: object) => apiClient(`/classes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiClient(`/classes/${id}`, { method: "DELETE" }),
};

export const sectionsApi = {
  getAll: (classId?: string) => apiClient(`/sections${classId ? `?classId=${classId}` : ""}`),
  create: (data: object) => apiClient("/sections", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: object) => apiClient(`/sections/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiClient(`/sections/${id}`, { method: "DELETE" }),
};

export const sessionsApi = {
  getAll: () => apiClient("/sessions"),
  create: (data: object) => apiClient("/sessions", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: object) => apiClient(`/sessions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiClient(`/sessions/${id}`, { method: "DELETE" }),
};

export const transportRoutesApi = {
  getAll: () => apiClient("/transport-routes"),
  create: (data: { name: string; monthlyFee: number }) =>
    apiClient("/transport-routes", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; monthlyFee?: number }) =>
    apiClient(`/transport-routes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiClient(`/transport-routes/${id}`, { method: "DELETE" }),
};

export const feeStructuresApi = {
  getAll: (params?: { classId?: string; sessionId?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return apiClient(`/fee-structures${query ? `?${query}` : ""}`);
  },
  getByClassSession: (classId: string, sessionId: string) =>
    apiClient(`/fee-structures/class/${classId}/session/${sessionId}`),
  create: (data: object) => apiClient("/fee-structures", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: object) => apiClient(`/fee-structures/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiClient(`/fee-structures/${id}`, { method: "DELETE" }),
};

export const studentsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/students${query ? `?${query}` : ""}`);
  },
  getById: (id: string) => apiClient(`/students/${id}`),
  create: (formData: FormData) => apiClient("/students", { method: "POST", body: formData }),
  importExcel: (formData: FormData) => apiClient("/students/import", { method: "POST", body: formData }),
  update: (id: string, formData: FormData) => apiClient(`/students/${id}`, { method: "PUT", body: formData }),
  updateFeeDiscount: (id: string, feeDiscount: number) =>
    apiClient(`/students/${id}/fee-discount`, {
      method: "PATCH",
      body: JSON.stringify({ feeDiscount }),
    }),
  delete: (id: string) => apiClient(`/students/${id}`, { method: "DELETE" }),
};

export const feePaymentsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/fee-payments${query ? `?${query}` : ""}`);
  },
  getStudentSummary: (studentId: string, sessionId?: string, includeAdmission?: boolean) => {
    const params = new URLSearchParams();
    if (sessionId) params.set("sessionId", sessionId);
    if (includeAdmission) params.set("includeAdmission", "true");
    const query = params.toString();
    return apiClient(`/fee-payments/student/${studentId}/summary${query ? `?${query}` : ""}`);
  },
  getStudentsOverview: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/fee-payments/students-overview${query ? `?${query}` : ""}`);
  },
  collect: (data: object) => apiClient("/fee-payments/collect", { method: "POST", body: JSON.stringify(data) }),
  getById: (id: string) => apiClient(`/fee-payments/${id}`),
};

export const dashboardApi = {
  getStats: (sessionId?: string) => {
    const query = sessionId ? `?sessionId=${sessionId}` : "";
    return apiClient(`/dashboard/stats${query}`);
  },
  getQuarterDetails: (sessionId: string, quarter: number) => {
    const params = new URLSearchParams({ sessionId, quarter: String(quarter) });
    return apiClient(`/dashboard/quarter-details?${params}`);
  },
  getReports: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/dashboard/reports${query ? `?${query}` : ""}`);
  },
  getReportCollectors: () => apiClient("/dashboard/reports/collectors"),
  downloadReportsExcel: async (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const base = typeof window !== "undefined" ? "/api" : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    const res = await fetch(`${base}/dashboard/reports/export${query ? `?${query}` : ""}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { message?: string }).message || "Failed to download report");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `quarterly-fee-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};

export const expensesApi = {
  getCategories: () => apiClient("/expenses/categories"),
  createCategory: (name: string) =>
    apiClient("/expenses/categories", { method: "POST", body: JSON.stringify({ name }) }),
  deleteCategory: (id: string) => apiClient(`/expenses/categories/${id}`, { method: "DELETE" }),
  getAll: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/expenses${query ? `?${query}` : ""}`);
  },
  getStats: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/expenses/stats${query ? `?${query}` : ""}`);
  },
  getById: (id: string) => apiClient(`/expenses/${id}`),
  create: (data: object) => apiClient("/expenses", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: object) => apiClient(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiClient(`/expenses/${id}`, { method: "DELETE" }),
};
