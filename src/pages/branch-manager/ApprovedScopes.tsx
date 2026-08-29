import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, FileCheck2, FolderKanban, MapPin, ArrowLeft, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useAuthStore } from "@/store/authStore";
import { useManagementStore } from "@/store/managementStore";
import { useMasterDataStore } from "@/store/masterDataStore";

export default function ApprovedScopes() {
  const { user } = useAuthStore();
  const { scopes, fetchScopes } = useManagementStore();
  const { fetchAll, initialized: masterInitialized, branches, getBranchName, getHubName, getLineName, getTransformerName } = useMasterDataStore();

  const navItems = user?.role === "senior_manager"
    ? [
        { label: "Executive Dashboard", path: "/senior-manager", icon: <FileCheck2 className="w-4 h-4" /> },
        { label: "Projects & Scopes", path: "/senior-manager/projects", icon: <FolderKanban className="w-4 h-4" /> },
        { label: "Approved Scopes", path: "/senior-manager/scopes", icon: <CheckCircle2 className="w-4 h-4" /> },
      ]
    : [
        { label: "Dashboard", path: "/branch-manager", icon: <FileCheck2 className="w-4 h-4" /> },
        { label: "New Entry", path: "/branch-manager/entry", icon: <FileCheck2 className="w-4 h-4" /> },
        { label: "Approved Scopes", path: "/branch-manager/scopes", icon: <CheckCircle2 className="w-4 h-4" /> },
        { label: "My History", path: "/branch-manager/history", icon: <FileCheck2 className="w-4 h-4" /> },
      ];

  useEffect(() => {
    fetchScopes();
    if (!masterInitialized) fetchAll();
  }, [fetchScopes, fetchAll, masterInitialized]);

  const branchApprovedScopes = useMemo(() => {
    if (!user?.branch && !user?.hubId) return [];

    const branchName = user.branch?.trim().toLowerCase();
    const branchId = branches.find(
      (branch) => {
        const masterBranchName = branch.name.trim().toLowerCase();
        return (
          masterBranchName === branchName ||
          masterBranchName === `${branchName} branch`
        );
      }
    )?.id;

    return [...scopes]
      .filter((scope) => scope.status === "approved")
      .filter((scope) => {
        if (!scope.branchId && !scope.hubId) return false;
        if (branchName) {
          return (
            scope.branchId === branchId ||
            scope.branchName?.trim().toLowerCase() === branchName ||
            scope.branchName?.trim().toLowerCase() === `${branchName} branch`
          );
        }
        return scope.hubId === user.hubId;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [scopes, user, branches]);

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar role={user?.role === "senior_manager" ? "senior_manager" : "branch_manager"} navItems={navItems} title={user?.role === "senior_manager" ? "Senior Manager Portal" : "Branch Manager Portal"} />

      <main className="container py-8 space-y-6 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link to="/branch-manager" className="p-2 rounded-xl text-slate-600 hover:text-brand-800 hover:bg-brand-50 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Approved Scope Registry</p>
              <h1 className="font-display text-2xl font-bold text-slate-900">
                {user?.role === "senior_manager" ? "Approved scopes across the network" : `Assigned scopes for ${user?.branch || getHubName(user?.hubId || "")}`}
              </h1>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            {branchApprovedScopes.length} approved
          </div>
        </motion.div>

        <div className="card p-6">
          {branchApprovedScopes.length === 0 ? (
            <div className="py-10 text-center">
              <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No approved scopes assigned to this branch yet.</p>
              <p className="text-sm text-slate-500 mt-1">Approved scopes will appear here once they are issued by the hub or senior management.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {branchApprovedScopes.map((scope) => (
                <motion.div
                  key={scope.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900">{scope.name}</p>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Approved</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{scope.description || "No description provided."}</p>
                    </div>
                    <div className="text-left lg:text-right text-xs text-slate-500">
                      <p className="font-medium text-slate-700">{scope.projectName || "Project"}</p>
                      <p>{scope.projectCode || "—"}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500">
                        <Building2 className="w-3.5 h-3.5" /> Hub
                      </div>
                      <p className="mt-2 font-semibold text-slate-800">{scope.hubName || getHubName(scope.hubId || "")}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500">
                        <MapPin className="w-3.5 h-3.5" /> Branch
                      </div>
                      <p className="mt-2 font-semibold text-slate-800">{scope.branchName || getBranchName(scope.branchId || "")}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Line
                      </div>
                      <p className="mt-2 font-semibold text-slate-800">{scope.lineName || getLineName(scope.lineId || "")}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500">
                        <FileCheck2 className="w-3.5 h-3.5" /> TRSFO
                      </div>
                      <p className="mt-2 font-semibold text-slate-800">{scope.transformerName || getTransformerName(scope.transformerId || "")}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                      <span>Planned KM: <strong className="text-slate-700">{scope.plannedKm}</strong></span>
                      <span>Transformers: <strong className="text-slate-700">{scope.plannedTransformers}</strong></span>
                      <span>Budget: <strong className="text-slate-700">{new Intl.NumberFormat("en-US", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(scope.budgetAllocated || 0)}</strong></span>
                    </div>
                    <span>Approved {scope.approvedAt ? new Date(scope.approvedAt).toLocaleDateString("en-GB") : "—"}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
