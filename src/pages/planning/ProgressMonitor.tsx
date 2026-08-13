import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  Network,
  TrendingUp,
  Target,
  Wallet,
  ListChecks,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useManagementStore } from "@/store/managementStore";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { scopeStatusLabels, taskStatusLabels, taskPriorityLabels } from "@/types";

const navItems = [
  { label: "Dashboard", path: "/hub-manager", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Projects", path: "/hub-manager/projects", icon: <FolderKanban className="w-4 h-4" /> },
  { label: "Network Assets", path: "/hub-manager/assets", icon: <Network className="w-4 h-4" /> },
  { label: "Progress Monitor", path: "/hub-manager/monitor", icon: <TrendingUp className="w-4 h-4" /> },
];

export default function ProgressMonitor() {
  const { projects, fetchProjects, monitorData, fetchMonitorData } = useManagementStore();
  const [selectedProject, setSelectedProject] = useState<string>("");

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (selectedProject) {
      fetchMonitorData(selectedProject);
    }
  }, [selectedProject, fetchMonitorData]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar role="hub_manager" navItems={navItems} title="Hub Manager Portal" />

      <main className="container py-5 space-y-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[10px] font-semibold text-violet-700 uppercase tracking-wider">Progress Tracking</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Progress Monitor</h1>
          <p className="text-slate-500 text-xs">Monitor progress against plans across all projects</p>
        </motion.div>

        <div>
          <label className="input-label">Select Project</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="input-field max-w-md"
          >
            <option value="">Choose a project to monitor...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>

        {!selectedProject ? (
          <div className="card p-12 text-center text-sm text-slate-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            Select a project above to view its progress monitoring dashboard.
          </div>
        ) : !monitorData ? (
          <div className="card p-12 text-center text-sm text-slate-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300 animate-pulse" />
            Loading monitor data...
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                title="Scopes Tracked"
                value={monitorData.scopeProgress.length}
                subtitle={`${monitorData.scopeProgress.filter((s) => s.status === "active").length} active`}
                icon={<Target className="w-5 h-5" />}
                iconBg="bg-violet-50"
                iconColor="text-violet-700"
                delay={0}
              />
              <StatCard
                title="Budget Categories"
                value={monitorData.budgetVsActual.length}
                subtitle={`${formatCurrency(monitorData.budgetVsActual.reduce((s, b) => s + b.spent, 0))} total spent`}
                icon={<Wallet className="w-5 h-5" />}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-700"
                delay={0.05}
              />
              <StatCard
                title="Total Tasks"
                value={monitorData.taskProgress.reduce((s, t) => s + t.count, 0)}
                subtitle={`${monitorData.taskProgress.filter((t) => t.status === "completed").reduce((s, t) => s + t.count, 0)} completed`}
                icon={<ListChecks className="w-5 h-5" />}
                iconBg="bg-blue-50"
                iconColor="text-blue-700"
                delay={0.1}
              />
              <StatCard
                title="Funds Available"
                value={formatCurrency(
                  monitorData.fundAvailability.totalAllocated -
                  monitorData.fundAvailability.totalDisbursed -
                  monitorData.fundAvailability.totalCommitted
                )}
                subtitle={`${formatCurrency(monitorData.fundAvailability.totalAllocated)} allocated`}
                icon={<DollarSign className="w-5 h-5" />}
                iconBg="bg-amber-50"
                iconColor="text-amber-700"
                delay={0.15}
              />
            </div>

            {/* Scope Progress */}
            <div className="card p-4 space-y-3">
              <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-violet-700" /> Scope Progress vs Plan
              </h2>
              {monitorData.scopeProgress.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No scopes defined for this project.</p>
              ) : (
                <div className="space-y-2">
                  {monitorData.scopeProgress.map((scope, i) => {
                    const kmPct = Math.min(scope.actualProgressPct || 0, 100);
                    const trPct = scope.plannedTransformers > 0 ? Math.min((scope.actualTransformers / scope.plannedTransformers) * 100, 100) : 0;
                    return (
                      <motion.div
                        key={scope.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-xl border border-slate-200/60 p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-slate-900">{scope.name}</span>
                          <span className={`status-pill ${
                            scope.status === "active" ? "bg-emerald-100 text-emerald-700" :
                            scope.status === "completed" ? "bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {scopeStatusLabels[scope.status]}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-600 mb-0.5">
                              <span>Cable Progress</span>
                              <span className="font-mono font-bold">{scope.actualProgressPct.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-violet-500 to-violet-700 rounded-full transition-all" style={{ width: `${kmPct}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-600 mb-0.5">
                              <span>Transformers Commissioned</span>
                              <span className="font-mono font-bold">{scope.actualTransformers} / {scope.plannedTransformers} ({Math.round(trPct)}%)</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all" style={{ width: `${trPct}%` }} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Budget vs Actual & Task Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-4 space-y-3">
                <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-700" /> Budget vs Actual
                </h2>
                {monitorData.budgetVsActual.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No budget data.</p>
                ) : (
                  <div className="space-y-2">
                    {monitorData.budgetVsActual.map((item) => {
                      const pct = item.planned > 0 ? Math.min((item.spent / item.planned) * 100, 100) : 0;
                      return (
                        <div key={item.category} className="rounded-lg border border-slate-200/60 p-2.5">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-900">{item.category}</span>
                            <span className="font-mono text-[10px] font-bold text-slate-700">
                              {formatCurrency(item.spent)} / {formatCurrency(item.planned)}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full rounded-full ${
                              pct < 70 ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
                              pct < 90 ? "bg-gradient-to-r from-amber-400 to-amber-600" :
                              "bg-gradient-to-r from-rose-500 to-rose-700"
                            }`} style={{ width: `${pct}%` }} />
                          </div>
                          {item.committed > 0 && (
                            <p className="text-[10px] text-amber-600 mt-0.5">+ {formatCurrency(item.committed)} committed</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="card p-4 space-y-3">
                <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-blue-700" /> Task Progress
                </h2>
                {monitorData.taskProgress.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No task data.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {monitorData.taskProgress.map((tp) => (
                      <div key={`${tp.status}-${tp.priority}`} className="rounded-lg bg-slate-50 p-2.5">
                        <div className="flex items-center gap-1 mb-0.5">
                          {tp.status === "completed" ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-slate-400" />}
                          <p className="text-[9px] font-semibold uppercase text-slate-500">
                            {taskStatusLabels[tp.status]}
                          </p>
                        </div>
                        <p className="text-[9px] text-slate-400">{taskPriorityLabels[tp.priority]}</p>
                        <p className="font-display text-lg font-bold text-slate-900">{tp.count}</p>
                        <p className="text-[9px] text-slate-500">{Math.round(tp.avgProgress)}% avg progress</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Fund Availability */}
            <div className="card p-4 space-y-3">
              <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-700" /> Fund Availability
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="rounded-lg bg-emerald-50 p-2.5">
                  <p className="text-[9px] font-semibold uppercase text-emerald-700">Allocated</p>
                  <p className="font-display text-sm font-bold text-emerald-800">{formatCurrency(monitorData.fundAvailability.totalAllocated)}</p>
                </div>
                <div className="rounded-lg bg-rose-50 p-2.5">
                  <p className="text-[9px] font-semibold uppercase text-rose-700">Disbursed</p>
                  <p className="font-display text-sm font-bold text-rose-800">{formatCurrency(monitorData.fundAvailability.totalDisbursed)}</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-2.5">
                  <p className="text-[9px] font-semibold uppercase text-amber-700">Committed</p>
                  <p className="font-display text-sm font-bold text-amber-800">{formatCurrency(monitorData.fundAvailability.totalCommitted)}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-2.5">
                  <p className="text-[9px] font-semibold uppercase text-blue-700">Refunded</p>
                  <p className="font-display text-sm font-bold text-blue-800">{formatCurrency(monitorData.fundAvailability.totalRefunded)}</p>
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-violet-50 to-emerald-50 border border-violet-200/60 p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-violet-600 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-violet-900">Net Available Funds</p>
                    <p className="font-display text-xl font-bold text-violet-900">
                      {formatCurrency(
                        monitorData.fundAvailability.totalAllocated -
                        monitorData.fundAvailability.totalDisbursed -
                        monitorData.fundAvailability.totalCommitted
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}