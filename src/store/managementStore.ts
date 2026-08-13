import { create } from "zustand";
import type {
  Project,
  Scope,
  Branch,
  Task,
  BudgetItem,
  FundTransaction,
  MonitorData,
  ProjectFormData,
  ScopeFormData,
  TaskFormData,
  BudgetItemFormData,
  FundTransactionFormData,
  BranchFormData,
} from "@/types";
import { managementApi } from "@/services/api";

interface ManagementState {
  projects: Project[];
  scopes: Scope[];
  branches: Branch[];
  tasks: Task[];
  budgetItems: BudgetItem[];
  funds: FundTransaction[];
  monitorData: MonitorData | null;
  loading: boolean;
  error: string | null;

  fetchProjects: (status?: string) => Promise<void>;
  fetchProject: (id: string) => Promise<Project | null>;
  createProject: (data: ProjectFormData) => Promise<Project | null>;
  updateProject: (id: string, data: Partial<ProjectFormData>) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;

  fetchScopes: (projectId?: string) => Promise<void>;
  createScope: (data: ScopeFormData) => Promise<Scope | null>;
  updateScope: (id: string, data: Partial<ScopeFormData>) => Promise<boolean>;
  approveScope: (id: string) => Promise<boolean>;
  deleteScope: (id: string) => Promise<boolean>;

  fetchTasks: (projectId?: string) => Promise<void>;
  createTask: (data: TaskFormData) => Promise<Task | null>;
  updateTask: (id: string, data: Partial<TaskFormData & { progressPct: number }>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;

  fetchBudgetItems: (projectId?: string) => Promise<void>;
  createBudgetItem: (data: BudgetItemFormData) => Promise<BudgetItem | null>;
  updateBudgetItem: (id: string, data: Partial<BudgetItemFormData>) => Promise<boolean>;
  deleteBudgetItem: (id: string) => Promise<boolean>;

  fetchFunds: (projectId?: string) => Promise<void>;
  createFund: (data: FundTransactionFormData) => Promise<FundTransaction | null>;
  deleteFund: (id: string) => Promise<boolean>;

  fetchBranches: (hubId?: string) => Promise<void>;
  createBranch: (data: BranchFormData) => Promise<Branch | null>;
  updateBranch: (id: string, data: Partial<BranchFormData>) => Promise<boolean>;
  deleteBranch: (id: string) => Promise<boolean>;

  fetchMonitorData: (projectId: string) => Promise<void>;

  getProjectById: (id: string) => Project | undefined;
  getScopesByProject: (projectId: string) => Scope[];
  getTasksByProject: (projectId: string) => Task[];
  getBudgetItemsByProject: (projectId: string) => BudgetItem[];
  getFundsByProject: (projectId: string) => FundTransaction[];
}

export const useManagementStore = create<ManagementState>((set, get) => ({
  projects: [],
  scopes: [],
  branches: [],
  tasks: [],
  budgetItems: [],
  funds: [],
  monitorData: null,
  loading: false,
  error: null,

  fetchProjects: async (status) => {
    set({ loading: true, error: null });
    try {
      const params = status ? { status } : undefined;
      const projects = await managementApi.listProjects(params);
      set({ projects, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load projects",
      });
    }
  },

  fetchProject: async (id) => {
    try {
      const project = await managementApi.getProject(id);
      set((state) => ({
        projects: state.projects.some((p) => p.id === id)
          ? state.projects.map((p) => (p.id === id ? project : p))
          : [...state.projects, project],
      }));
      return project;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load project",
      });
      return null;
    }
  },

  createProject: async (data) => {
    try {
      const project = await managementApi.createProject(data);
      set((state) => ({ projects: [project, ...state.projects] }));
      return project;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to create project",
      });
      return null;
    }
  },

  updateProject: async (id, data) => {
    try {
      const updated = await managementApi.updateProject(id, data);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
      }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to update project",
      });
      return false;
    }
  },

  deleteProject: async (id) => {
    try {
      await managementApi.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        scopes: state.scopes.filter((s) => s.projectId !== id),
        tasks: state.tasks.filter((t) => t.projectId !== id),
        budgetItems: state.budgetItems.filter((b) => b.projectId !== id),
        funds: state.funds.filter((f) => f.projectId !== id),
      }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete project",
      });
      return false;
    }
  },

  fetchScopes: async (projectId) => {
    try {
      const params = projectId ? { projectId } : undefined;
      const scopes = await managementApi.listScopes(params);
      set({ scopes });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load scopes",
      });
    }
  },

  createScope: async (data) => {
    try {
      const scope = await managementApi.createScope(data);
      set((state) => ({ scopes: [scope, ...state.scopes] }));
      return scope;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to create scope",
      });
      return null;
    }
  },

  updateScope: async (id, data) => {
    try {
      const updated = await managementApi.updateScope(id, data);
      set((state) => ({
        scopes: state.scopes.map((s) => (s.id === id ? updated : s)),
      }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to update scope",
      });
      return false;
    }
  },

  approveScope: async (id) => {
    try {
      const updated = await managementApi.approveScope(id);
      set((state) => ({
        scopes: state.scopes.map((s) => (s.id === id ? updated : s)),
      }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to approve scope",
      });
      return false;
    }
  },

  deleteScope: async (id) => {
    try {
      await managementApi.deleteScope(id);
      set((state) => ({
        scopes: state.scopes.filter((s) => s.id !== id),
      }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete scope",
      });
      return false;
    }
  },

  fetchTasks: async (projectId) => {
    try {
      const params = projectId ? { projectId } : undefined;
      const tasks = await managementApi.listTasks(params);
      set({ tasks });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load tasks",
      });
    }
  },

  createTask: async (data) => {
    try {
      const task = await managementApi.createTask(data);
      set((state) => ({ tasks: [task, ...state.tasks] }));
      return task;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to create task",
      });
      return null;
    }
  },

  updateTask: async (id, data) => {
    try {
      const updated = await managementApi.updateTask(id, data);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
      }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to update task",
      });
      return false;
    }
  },

  deleteTask: async (id) => {
    try {
      await managementApi.deleteTask(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete task",
      });
      return false;
    }
  },

  fetchBudgetItems: async (projectId) => {
    try {
      const params = projectId ? { projectId } : undefined;
      const budgetItems = await managementApi.listBudgetItems(params);
      set({ budgetItems });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load budget items",
      });
    }
  },

  createBudgetItem: async (data) => {
    try {
      const item = await managementApi.createBudgetItem(data);
      set((state) => ({ budgetItems: [item, ...state.budgetItems] }));
      return item;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to create budget item",
      });
      return null;
    }
  },

  updateBudgetItem: async (id, data) => {
    try {
      const updated = await managementApi.updateBudgetItem(id, data);
      set((state) => ({
        budgetItems: state.budgetItems.map((b) => (b.id === id ? updated : b)),
      }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to update budget item",
      });
      return false;
    }
  },

  deleteBudgetItem: async (id) => {
    try {
      await managementApi.deleteBudgetItem(id);
      set((state) => ({
        budgetItems: state.budgetItems.filter((b) => b.id !== id),
      }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete budget item",
      });
      return false;
    }
  },

  fetchFunds: async (projectId) => {
    try {
      const params = projectId ? { projectId } : undefined;
      const funds = await managementApi.listFunds(params);
      set({ funds });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load fund transactions",
      });
    }
  },

  createFund: async (data) => {
    try {
      const fund = await managementApi.createFund(data);
      set((state) => ({ funds: [fund, ...state.funds] }));
      return fund;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to create fund transaction",
      });
      return null;
    }
  },

  deleteFund: async (id) => {
    try {
      await managementApi.deleteFund(id);
      set((state) => ({
        funds: state.funds.filter((f) => f.id !== id),
      }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete fund transaction",
      });
      return false;
    }
  },

  fetchBranches: async (hubId) => {
    try {
      const branches = await managementApi.listBranches(hubId);
      set({ branches });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load branches",
      });
    }
  },

  createBranch: async (data) => {
    try {
      const branch = await managementApi.createBranch(data);
      set((state) => ({ branches: [branch, ...state.branches] }));
      return branch;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to create branch",
      });
      return null;
    }
  },

  updateBranch: async (id, data) => {
    try {
      const updated = await managementApi.updateBranch(id, data);
      set((state) => ({
        branches: state.branches.map((b) => (b.id === id ? updated : b)),
      }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to update branch",
      });
      return false;
    }
  },

  deleteBranch: async (id) => {
    try {
      await managementApi.deleteBranch(id);
      set((state) => ({
        branches: state.branches.filter((b) => b.id !== id),
      }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete branch",
      });
      return false;
    }
  },

  fetchMonitorData: async (projectId) => {
    try {
      const monitorData = await managementApi.getMonitorData(projectId);
      set({ monitorData });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load monitor data",
      });
    }
  },

  getProjectById: (id) => get().projects.find((p) => p.id === id),
  getScopesByProject: (projectId) => get().scopes.filter((s) => s.projectId === projectId),
  getTasksByProject: (projectId) => get().tasks.filter((t) => t.projectId === projectId),
  getBudgetItemsByProject: (projectId) => get().budgetItems.filter((b) => b.projectId === projectId),
  getFundsByProject: (projectId) => get().funds.filter((f) => f.projectId === projectId),
}));