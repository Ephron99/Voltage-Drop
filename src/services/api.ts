import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import type {
  User,
  UserRole,
  LoginFormData,
  Location,
  Line,
  Transformer,
  ProgressEntry,
  ProgressFormData,
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

  getLines: async (locationId?: string): Promise<Line[]> => {
    const params = locationId ? { locationId } : undefined;
    const response = await api.get<ApiResponse<Line[]>>("/master/lines", { params });
    return response.data.data;
  },

  getTransformers: async (lineId?: string): Promise<Transformer[]> => {
    const params = lineId ? { lineId } : undefined;
    const response = await api.get<ApiResponse<Transformer[]>>("/master/transformers", { params });
    return response.data.data;
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
