import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import type {
  User,
  UserRole,
  Hub,
  LoginFormData,
  Location,
  Line,
  Transformer,
  ProgressEntry,
  ProgressFormData,
  Project,
  Scope,
  Branch,
  Task,
  BudgetItem,
  FundTransaction,
  ProjectFormData,
  ScopeFormData,
  TaskFormData,
  BudgetItemFormData,
  FundTransactionFormData,
  BranchFormData,
  MonitorData,
} from "@/types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface LoginResponse {
  token: string;
  user: User;
  expiresIn: string;
}

interface ListParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  [key: string]: unknown;
}

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  timeout: 15000,
  withCredentials: true,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (data: LoginFormData): Promise<LoginResponse> => {
    const response = await api.post<ApiResponse<LoginResponse>>("/auth/login", data);
    return response.data.data;
  },

  me: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>("/auth/me");
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    try {
      await api.post<ApiResponse<void>>("/auth/logout");
    } catch {
      // ignore network errors on logout
    }
  },
};

interface NewUserData {
  email: string;
  name: string;
  role: UserRole;
  branch?: string;
  hubId?: string;
  password: string;
}

export const usersApi = {
  list: async (params?: ListParams): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>("/users", { params });
    return response.data.data;
  },

  get: async (id: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  create: async (data: NewUserData): Promise<User> => {
    const response = await api.post<ApiResponse<User>>("/users", data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<NewUserData>): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/users/${id}`);
  },

  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    await api.post<ApiResponse<void>>(`/users/${id}/reset-password`, {
      newPassword,
    });
  },
};

export const masterApi = {
  getLocations: async (): Promise<Location[]> => {
    const response = await api.get<ApiResponse<Location[]>>("/master/locations");
    return response.data.data;
  },

  getLines: async (branchId?: string): Promise<Line[]> => {
    const params = branchId ? { branchId } : undefined;
    const response = await api.get<ApiResponse<Line[]>>("/master/lines", { params });
    return response.data.data;
  },

  getTransformers: async (lineId?: string): Promise<Transformer[]> => {
    const params = lineId ? { lineId } : undefined;
    const response = await api.get<ApiResponse<Transformer[]>>("/master/transformers", { params });
    return response.data.data;
  },

  createLocation: async (data: { name: string; address: string; governorate: string }): Promise<Location> => {
    const response = await api.post<ApiResponse<Location>>("/master/locations", data);
    return response.data.data;
  },

  updateLocation: async (id: string, data: Partial<{ name: string; address: string; governorate: string }>): Promise<Location> => {
    const response = await api.patch<ApiResponse<Location>>(`/master/locations/${id}`, data);
    return response.data.data;
  },

  deleteLocation: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/master/locations/${id}`);
  },

  createLine: async (data: { name: string; voltageLevel: string; branchId: string }): Promise<Line> => {
    const response = await api.post<ApiResponse<Line>>("/master/lines", data);
    return response.data.data;
  },

  updateLine: async (id: string, data: Partial<{ name: string; voltageLevel: string; branchId: string }>): Promise<Line> => {
    const response = await api.patch<ApiResponse<Line>>(`/master/lines/${id}`, data);
    return response.data.data;
  },

  deleteLine: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/master/lines/${id}`);
  },

  createTransformer: async (data: { name: string; serialNumber: string; capacityKVA: number; lineId: string }): Promise<Transformer> => {
    const response = await api.post<ApiResponse<Transformer>>("/master/transformers", data);
    return response.data.data;
  },

  updateTransformer: async (id: string, data: Partial<{ name: string; serialNumber: string; capacityKVA: number; lineId: string }>): Promise<Transformer> => {
    const response = await api.patch<ApiResponse<Transformer>>(`/master/transformers/${id}`, data);
    return response.data.data;
  },

  deleteTransformer: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/master/transformers/${id}`);
  },
};

export const progressApi = {
  list: async (params?: ListParams): Promise<ProgressEntry[]> => {
    const response = await api.get<ApiResponse<ProgressEntry[]>>("/progress", { params });
    return response.data.data;
  },

  get: async (id: string): Promise<ProgressEntry> => {
    const response = await api.get<ApiResponse<ProgressEntry>>(`/progress/${id}`);
    return response.data.data;
  },

  create: async (data: ProgressFormData & { siteEngineerId: string; siteEngineerName: string }): Promise<ProgressEntry> => {
    const response = await api.post<ApiResponse<ProgressEntry>>("/progress", data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<ProgressFormData>): Promise<ProgressEntry> => {
    const response = await api.patch<ApiResponse<ProgressEntry>>(`/progress/${id}`, data);
    return response.data.data;
  },

  submit: async (id: string): Promise<ProgressEntry> => {
    const response = await api.post<ApiResponse<ProgressEntry>>(`/progress/${id}/submit`);
    return response.data.data;
  },

  approve: async (id: string): Promise<ProgressEntry> => {
    const response = await api.post<ApiResponse<ProgressEntry>>(`/progress/${id}/approve`);
    return response.data.data;
  },

  reject: async (id: string, comments: string): Promise<ProgressEntry> => {
    const response = await api.post<ApiResponse<ProgressEntry>>(`/progress/${id}/reject`, {
      comments,
    });
    return response.data.data;
  },

  publish: async (id: string): Promise<ProgressEntry> => {
    const response = await api.post<ApiResponse<ProgressEntry>>(`/progress/${id}/publish`);
    return response.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/progress/${id}`);
  },
};

export const managementApi = {
  // Projects
  listProjects: async (params?: { status?: string }): Promise<Project[]> => {
    const response = await api.get<ApiResponse<Project[]>>("/management/projects", { params });
    return response.data.data;
  },

  getProject: async (id: string): Promise<Project> => {
    const response = await api.get<ApiResponse<Project>>(`/management/projects/${id}`);
    return response.data.data;
  },

  createProject: async (data: ProjectFormData): Promise<Project> => {
    const response = await api.post<ApiResponse<Project>>("/management/projects", data);
    return response.data.data;
  },

  updateProject: async (id: string, data: Partial<ProjectFormData>): Promise<Project> => {
    const response = await api.patch<ApiResponse<Project>>(`/management/projects/${id}`, data);
    return response.data.data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/management/projects/${id}`);
  },

  // Scopes
  listScopes: async (params?: { projectId?: string; status?: string }): Promise<Scope[]> => {
    const response = await api.get<ApiResponse<Scope[]>>("/management/scopes", { params });
    return response.data.data;
  },

  createScope: async (data: ScopeFormData): Promise<Scope> => {
    const response = await api.post<ApiResponse<Scope>>("/management/scopes", data);
    return response.data.data;
  },

  updateScope: async (id: string, data: Partial<ScopeFormData>): Promise<Scope> => {
    const response = await api.patch<ApiResponse<Scope>>(`/management/scopes/${id}`, data);
    return response.data.data;
  },

  approveScope: async (id: string): Promise<Scope> => {
    const response = await api.post<ApiResponse<Scope>>(`/management/scopes/${id}/approve`);
    return response.data.data;
  },

  deleteScope: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/management/scopes/${id}`);
  },

  // Tasks
  listTasks: async (params?: { projectId?: string; scopeId?: string; assignedTo?: string; status?: string }): Promise<Task[]> => {
    const response = await api.get<ApiResponse<Task[]>>("/management/tasks", { params });
    return response.data.data;
  },

  createTask: async (data: TaskFormData): Promise<Task> => {
    const response = await api.post<ApiResponse<Task>>("/management/tasks", data);
    return response.data.data;
  },

  updateTask: async (id: string, data: Partial<TaskFormData & { progressPct: number; actualStartDate?: string; actualEndDate?: string }>): Promise<Task> => {
    const response = await api.patch<ApiResponse<Task>>(`/management/tasks/${id}`, data);
    return response.data.data;
  },

  deleteTask: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/management/tasks/${id}`);
  },

  // Budget Items
  listBudgetItems: async (params?: { projectId?: string; scopeId?: string; category?: string }): Promise<BudgetItem[]> => {
    const response = await api.get<ApiResponse<BudgetItem[]>>("/management/budget-items", { params });
    return response.data.data;
  },

  createBudgetItem: async (data: BudgetItemFormData): Promise<BudgetItem> => {
    const response = await api.post<ApiResponse<BudgetItem>>("/management/budget-items", data);
    return response.data.data;
  },

  updateBudgetItem: async (id: string, data: Partial<BudgetItemFormData>): Promise<BudgetItem> => {
    const response = await api.patch<ApiResponse<BudgetItem>>(`/management/budget-items/${id}`, data);
    return response.data.data;
  },

  deleteBudgetItem: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/management/budget-items/${id}`);
  },

  // Fund Transactions
  listFunds: async (params?: { projectId?: string; type?: string }): Promise<FundTransaction[]> => {
    const response = await api.get<ApiResponse<FundTransaction[]>>("/management/funds", { params });
    return response.data.data;
  },

  createFund: async (data: FundTransactionFormData): Promise<FundTransaction> => {
    const response = await api.post<ApiResponse<FundTransaction>>("/management/funds", data);
    return response.data.data;
  },

  deleteFund: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/management/funds/${id}`);
  },

  // Branches
  listBranches: async (hubId?: string): Promise<Branch[]> => {
    const params = hubId ? { hubId } : undefined;
    const response = await api.get<ApiResponse<Branch[]>>("/management/branches", { params });
    return response.data.data;
  },

  createBranch: async (data: BranchFormData): Promise<Branch> => {
    const response = await api.post<ApiResponse<Branch>>("/management/branches", data);
    return response.data.data;
  },

  updateBranch: async (id: string, data: Partial<BranchFormData>): Promise<Branch> => {
    const response = await api.patch<ApiResponse<Branch>>(`/management/branches/${id}`, data);
    return response.data.data;
  },

  deleteBranch: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/management/branches/${id}`);
  },

  // Progress Monitoring
  getMonitorData: async (projectId: string): Promise<MonitorData> => {
    const response = await api.get<ApiResponse<MonitorData>>(`/management/monitor/${projectId}`);
    return response.data.data;
  },
};

export const hubsApi = {
  list: async (): Promise<Hub[]> => {
    const response = await api.get<ApiResponse<Hub[]>>("/hubs");
    return response.data.data;
  },

  get: async (id: string): Promise<Hub> => {
    const response = await api.get<ApiResponse<Hub>>(`/hubs/${id}`);
    return response.data.data;
  },

  create: async (data: { name: string; region: string }): Promise<Hub> => {
    const response = await api.post<ApiResponse<Hub>>("/hubs", data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<{ name: string; region: string }>): Promise<Hub> => {
    const response = await api.patch<ApiResponse<Hub>>(`/hubs/${id}`, data);
    return response.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/hubs/${id}`);
  },
};
