export type UserRole =
  | "site_engineer"
  | "branch_manager"
  | "planning"
  | "senior_management"
  | "it_engineer"
  | "trusted_admin";

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
  avatar?: string;
  password?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  governorate: string;
}

export interface Line {
  id: string;
  name: string;
  voltageLevel: VoltageLevel;
  locationId: string;
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
  locationId: string;
  lineId: string;
  voltageLevel: VoltageLevel;
  transformerId: string;
  completedKm: number;
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
  locationId: string;
  lineId: string;
  voltageLevel: VoltageLevel;
  transformerId: string;
  completedKm: number;
  transformersInstalled: number;
  transformersTerminated: number;
  transformersTested: number;
  transformersCommissioned: number;
}

export interface RejectFormData {
  comments: string;
}

export const roleLabels: Record<UserRole, string> = {
  site_engineer: "Site Engineer",
  branch_manager: "Branch Manager",
  planning: "Planning Department",
  senior_management: "Senior Management",
  it_engineer: "IT Engineer",
  trusted_admin: "Trusted Administrator",
};

export const statusLabels: Record<EntryStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  published: "Published",
  rejected: "Rejected",
};