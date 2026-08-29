export type UserRole =
  | "branch_manager"
  | "hub_manager"
  | "senior_manager"
  | "admin";

export type VoltageLevel = "MV" | "LV";

export type EntryStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "published"
  | "rejected";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branch?: string;
  hubId?: string;
  hubName?: string;
  hubRegion?: string;
  avatar?: string;
  password?: string;
  createdAt: string;
  lastLoginAt?: string;
}

// Hub represents the second level of the Rwanda hierarchy:
// Nation → Hub → Branch → Line/Feeder → Transformer
export interface Hub {
  id: string;
  name: string;
  region: string;
  branchManagerCount?: number;
  siteEngineerCount?: number;
  branchCount?: number;
  lineCount?: number;
  transformerCount?: number;
  locationCount?: number;
  managers?: Array<{ id: string; name: string; email: string; branch?: string }>;
  engineers?: Array<{ id: string; name: string; email: string; branch?: string }>;
  locations?: Array<{ id: string; name: string; address: string; governorate: string }>;
  branches?: Array<{
    id: string;
    name: string;
    lengthKm: number;
    conductorType?: string;
    status: BranchStatus;
    lineCount: number;
    transformerCount: number;
  }>;
  stats?: {
    totalEntries: number;
    publishedCount: number;
    submittedCount: number;
    rejectedCount: number;
    avgProgress: number;
    transformersCommissioned: number;
  };
}

export interface Location {
  id: string;
  name: string;
  address: string;
  governorate: string;
  hubId?: string;
}

export interface Line {
  id: string;
  name: string;
  voltageLevel: VoltageLevel;
  branchId: string;
}

export interface Transformer {
  id: string;
  name: string;
  serialNumber: string;
  capacityKVA: number;
  lineId: string;
}

export interface ProgressEntry {
  id: string;
  entryDate: string;
  locationId?: string;
  scopeId?: string;
  completedKm?: number;
  lineId: string;
  voltageLevel: VoltageLevel;
  transformerId: string;
  progressPct: number;
  transformersInstalled: number;
  transformersTerminated: number;
  transformersTested: number;
  transformersCommissioned: number;
  status: EntryStatus;
  siteEngineerId: string;
  siteEngineerName?: string;
  submittedAt?: string;
  branchManagerId?: string;
  branchManagerName?: string;
  approvedAt?: string;
  publishedAt?: string;
  rejectionComments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  role: UserRole;
}

export interface ProgressFormData {
  entryDate: string;
  locationId?: string;
  scopeId: string;
  completedKm: number;
  lineId: string;
  voltageLevel: VoltageLevel;
  transformerId: string;
  progressPct: number;
  transformersInstalled: number;
  transformersTerminated: number;
  transformersTested: number;
  transformersCommissioned: number;
}

export interface RejectFormData {
  comments: string;
}

// ============================================================
// Management Portal Types
// ============================================================

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";
export type ScopeStatus = "draft" | "approved";
export type TaskStatus = "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type BudgetItemStatus = "planned" | "active" | "exhausted" | "closed";
export type BranchStatus = "planned" | "under_construction" | "energized" | "decommissioned";
export type FundTransactionType = "allocation" | "disbursement" | "commitment" | "refund";

export interface BudgetSummary {
  totalPlanned: number;
  totalSpent: number;
  totalCommitted: number;
}

export interface FundSummary {
  totalAllocated: number;
  totalDisbursed: number;
  totalCommitted: number;
  totalRefunded: number;
}

export interface TaskSummary {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  assignedTasks: number;
  avgProgress: number;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  totalBudget: number;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  budgetSummary?: BudgetSummary;
  fundSummary?: FundSummary;
  taskSummary?: TaskSummary;
  scopeCount?: number;
}

export interface Scope {
  id: string;
  projectId: string;
  hubId?: string;
  branchId?: string;
  lineId?: string;
  transformerId?: string;
  name: string;
  description?: string;
  status: ScopeStatus;
  plannedKm: number;
  plannedTransformers: number;
  budgetAllocated: number;
  projectName?: string;
  projectCode?: string;
  hubName?: string;
  branchName?: string;
  lineName?: string;
  transformerName?: string;
  createdByName?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  hubId: string;
  lengthKm: number;
  conductorType?: string;
  status: BranchStatus;
  hubName?: string;
  lineCount?: number;
  transformerCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  scopeId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  assignedBy: string;
  lineId?: string;
  transformerId?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  progressPct: number;
  projectName?: string;
  projectCode?: string;
  scopeName?: string;
  assignedToName?: string;
  assignedByName?: string;
  lineName?: string;
  transformerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItem {
  id: string;
  projectId: string;
  scopeId?: string;
  category: string;
  description?: string;
  plannedAmount: number;
  spentAmount: number;
  committedAmount: number;
  status: BudgetItemStatus;
  projectName?: string;
  projectCode?: string;
  scopeName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FundTransaction {
  id: string;
  projectId: string;
  type: FundTransactionType;
  amount: number;
  description?: string;
  reference?: string;
  transactionDate: string;
  createdBy: string;
  createdByName?: string;
  projectName?: string;
  projectCode?: string;
  createdAt: string;
}

export interface ProjectFormData {
  code: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  totalBudget: number;
}

export interface ScopeFormData {
  projectId: string;
  hubId?: string;
  branchId?: string;
  lineId?: string;
  transformerId?: string;
  name: string;
  description?: string;
  status: ScopeStatus;
  plannedKm: number;
  plannedTransformers: number;
  budgetAllocated: number;
}

export interface TaskFormData {
  projectId: string;
  scopeId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  lineId?: string;
  transformerId?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
}

export interface BudgetItemFormData {
  projectId: string;
  scopeId?: string;
  category: string;
  description?: string;
  plannedAmount: number;
  spentAmount: number;
  committedAmount: number;
  status: BudgetItemStatus;
}

export interface FundTransactionFormData {
  projectId: string;
  type: FundTransactionType;
  amount: number;
  description?: string;
  reference?: string;
  transactionDate: string;
}

export interface BranchFormData {
  name: string;
  hubId: string;
  lengthKm: number;
  conductorType?: string;
  status: BranchStatus;
}

export interface MonitorData {
  scopeProgress: Array<{
    id: string;
    name: string;
    status: ScopeStatus;
    plannedKm: number;
    plannedTransformers: number;
    budgetAllocated: number;
    actualProgressPct: number;
    actualTransformers: number;
  }>;
  taskProgress: Array<{
    status: TaskStatus;
    priority: TaskPriority;
    count: number;
    avgProgress: number;
  }>;
  budgetVsActual: Array<{
    category: string;
    planned: number;
    spent: number;
    committed: number;
  }>;
  fundAvailability: FundSummary;
}

export const projectStatusLabels: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const scopeStatusLabels: Record<ScopeStatus, string> = {
  draft: "Draft",
  approved: "Approved",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const budgetItemStatusLabels: Record<BudgetItemStatus, string> = {
  planned: "Planned",
  active: "Active",
  exhausted: "Exhausted",
  closed: "Closed",
};

export const branchStatusLabels: Record<BranchStatus, string> = {
  planned: "Planned",
  under_construction: "Under Construction",
  energized: "Energized",
  decommissioned: "Decommissioned",
};

export const fundTypeLabels: Record<FundTransactionType, string> = {
  allocation: "Allocation",
  disbursement: "Disbursement",
  commitment: "Commitment",
  refund: "Refund",
};

export const roleLabels: Record<UserRole, string> = {
  branch_manager: "Branch Manager",
  hub_manager: "Hub Manager",
  senior_manager: "Senior Manager",
  admin: "Admin",
};

export const rolePortalLabels: Record<UserRole, string> = {
  branch_manager: "Branch Manager Portal",
  hub_manager: "Hub Manager Portal",
  senior_manager: "Senior Management Portal",
  admin: "Admin Portal",
};

export const statusLabels: Record<EntryStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  published: "Published",
  rejected: "Rejected",
};