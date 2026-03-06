import type { Project, ConstructionRecord, Invoice, Submission, CostEntry, ClientFormat, LineItem } from "@/types/construction";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token !== undefined ? { Authorization: `Bearer ${token}` } : getAuthHeaders()),
    ...(init.headers as HeadersInit),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error || res.statusText || "Request failed");
  }
  return data as T;
}

export const authApi = {
  register: (body: { email: string; password: string; confirmPassword: string; name: string }) =>
    api<{ token: string; user: { id: number; email: string; name: string } }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    api<{ token: string; user: { id: number; email: string; name: string } }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  me: () => api<{ user: { id: number; email: string; name: string } }>("/api/auth/me"),
};

export const projectsApi = {
  list: () => api<{ projects: Project[] }>("/api/projects"),
  get: (id: string) => api<Project>(`/api/projects/${id}`),
  create: (body: {
    projectNumber?: string;
    name: string;
    client: string;
    clientCode: string;
    dueDate: string;
    items: Array<Partial<LineItem> & { quantity: number; unit: string; unitPrice: number; date?: string; description?: string; taxRate?: number }>;
    notes?: string;
  }) => api<Project>("/api/projects", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Project> & { items?: LineItem[] }) =>
    api<Project>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => api<void>(`/api/projects/${id}`, { method: "DELETE" }),
};

export const recordsApi = {
  list: () => api<{ records: ConstructionRecord[] }>("/api/records"),
  create: (body: Omit<ConstructionRecord, "id">) => api<ConstructionRecord>("/api/records", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<ConstructionRecord>) =>
    api<ConstructionRecord>(`/api/records/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => api<void>(`/api/records/${id}`, { method: "DELETE" }),
};

export const invoicesApi = {
  list: () => api<{ invoices: Invoice[] }>("/api/invoices"),
  get: (id: string) => api<Invoice>(`/api/invoices/${id}`),
  create: (body: {
    projectId: string;
    projectName: string;
    client: string;
    clientCode: string;
    format: "自社書式" | "元請書式";
    clientFormatId?: string | null;
    issueDate: string;
    dueDate: string;
    items: LineItem[];
  }) => api<Invoice>("/api/invoices", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Invoice> & { items?: LineItem[] }) =>
    api<Invoice>(`/api/invoices/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => api<void>(`/api/invoices/${id}`, { method: "DELETE" }),
};

export const submissionsApi = {
  list: () => api<{ submissions: Submission[] }>("/api/submissions"),
  create: (body: Omit<Submission, "id">) => api<Submission>("/api/submissions", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Submission>) =>
    api<Submission>(`/api/submissions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => api<void>(`/api/submissions/${id}`, { method: "DELETE" }),
};

export const costsApi = {
  list: () => api<{ costs: CostEntry[] }>("/api/costs"),
  create: (body: Omit<CostEntry, "id" | "difference">) => api<CostEntry>("/api/costs", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<CostEntry>) =>
    api<CostEntry>(`/api/costs/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => api<void>(`/api/costs/${id}`, { method: "DELETE" }),
};

export const clientFormatsApi = {
  list: () => api<{ clientFormats: ClientFormat[] }>("/api/client-formats"),
  create: (body: Omit<ClientFormat, "id">) => api<ClientFormat>("/api/client-formats", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<ClientFormat>) =>
    api<ClientFormat>(`/api/client-formats/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => api<void>(`/api/client-formats/${id}`, { method: "DELETE" }),
};
