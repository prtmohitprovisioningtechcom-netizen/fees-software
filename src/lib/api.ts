// Browser: always same-origin /api (works on Vercel + localhost)
// Server: full URL for local custom server
const API_URL =
  typeof window !== "undefined"
    ? "/api"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers, ...rest } = options;

  const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: {
      ...(rest.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
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
  delete: (id: string) => apiClient(`/students/${id}`, { method: "DELETE" }),
};

export const feePaymentsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/fee-payments${query ? `?${query}` : ""}`);
  },
  getStudentSummary: (studentId: string, sessionId?: string) => {
    const query = sessionId ? `?sessionId=${sessionId}` : "";
    return apiClient(`/fee-payments/student/${studentId}/summary${query}`);
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
  getReports: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/dashboard/reports${query ? `?${query}` : ""}`);
  },
};
