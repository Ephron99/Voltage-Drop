import { CheckCircle2, Clock, Eye, FileEdit, Shield, ShieldX, XCircle } from "lucide-react";
import type { EntryStatus, UserRole } from "@/types";
import { statusLabels, roleLabels } from "@/types";

interface StatusBadgeProps {
  status: EntryStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const icons = {
    draft: <FileEdit className="w-3 h-3" />,
    submitted: <Clock className="w-3 h-3" />,
    approved: <Eye className="w-3 h-3" />,
    published: <CheckCircle2 className="w-3 h-3" />,
    rejected: <XCircle className="w-3 h-3" />,
  };

  const statusClass = `status-${status}`;

  return (
    <span className={`status-pill ${statusClass} ${className}`}>
      {icons[status]}
      {statusLabels[status]}
    </span>
  );
}

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  const icon =
    role === "site_engineer" || role === "branch_manager" ? (
      <Shield className="w-3 h-3" />
    ) : (
      <ShieldX className="w-3 h-3" />
    );

  const styles: Record<UserRole, string> = {
    site_engineer: "bg-blue-50 text-blue-700 border border-blue-200",
    branch_manager: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    planning: "bg-violet-50 text-violet-700 border border-violet-200",
    senior_management: "bg-amber-50 text-amber-700 border border-amber-200",
    it_engineer: "bg-slate-100 text-slate-700 border border-slate-200",
    trusted_admin: "bg-rose-50 text-rose-700 border border-rose-200",
  };

  return (
    <span className={`status-pill ${styles[role]} ${className}`}>
      {icon}
      {roleLabels[role]}
    </span>
  );
}
