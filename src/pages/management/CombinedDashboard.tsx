import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  Network,
  Wallet,
  ListChecks,
  TrendingUp,
  ArrowRight,
  Activity,
  DollarSign,
  CheckCircle2,
  Clock,
  Gauge,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  FileCheck2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useAuthStore } from "@/store/authStore";
import { useManagementStore } from "@/store/managementStore";
import { useProgressStore } from "@/store/progressStore";
import { useMasterDataStore } from "@/store/masterDataStore";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { projectStatusLabels } from "@/types";
import type { ProjectStatus } from "@/types";

const navItems = [
  { label: "Dashboard", path: "/senior-manager", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Projects", path: "/hub-manager/projects", icon: <FolderKanban className="w-4 h-4" /> },
  { label: "Network Assets", path: "/hub-manager/assets", icon: <Network className="w-4 h-4" /> },
  { label: "Progress Monitor", path: "/hub-manager/monitor", icon: <TrendingUp className="w-4 h-4" /> },
  { label: "Published Records", path: "/senior-manager/records", icon: <FileCheck2 className="w-4 h-4" /> },
];

const statusColors: Record<ProjectStatus, string> = {
  planning: "bg-slate-100 text-slate-700",
  active: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-rose-100 text-rose-700",
};

const PIE_COLORS = ["#7c3aed", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"];

export default function CombinedDashboard() {
  const { user } = useAuthStore();
  const { projects, fetchProjects, loading } = useManagementStore();
  const { fetchScopes } = useManagementStore();
  const { fetchTasks, tasks } = useManagementStore();
  const { fetchBudgetItems } = useManagementStore();
  const { fetchFunds } = useManagementStore();
  const rawEntries = useProgressStore((s) => s.entries);
  const { fetchEntries } = useProgressStore();
  const { locations, fetchAll, initialized: masterInitialized } = useMasterDataStore();

  useEffect(() => {
    fetchProjects();
    fetchScopes();
    fetchTasks();
    fetchBudgetItems();
    fetchFunds();
    fetchEntries();
  }, [fetchProjects, fetchScopes, fetchTasks, fetchBudgetItems, fetchFunds, fetchEntries]);

  useEffect(() => {
    if (!masterInitialized) {
      fetchAll();
    }
  }, [fetchAll, masterInitialized]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "RWF",
      maximumFractionDigits: 0,
    }).format(n);

  // ============================================================
  // Planning Metrics
  // ============================================================
  const planningStats = useMemo(() => {
    const active = projects.filter((p) => p.status === "active");
    const completed = projects.filter((p) => p.status === "completed");
    const totalBudget = projects.reduce((sum, p) => sum + (p.totalBudget || 0), 0);
    const totalAllocated = projects.reduce(
      (sum, p) => sum + (p.fundSummary?.totalAllocated || 0),
      0
    );
    const totalDisbursed = projects.reduce(
      (sum, p) => sum + (p.fundSummary?.totalDisbursed || 0),
      0
    );
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    return {
      totalProjects: projects.length,
      activeProjects: active.length,
      completedProjects: completed.length,
      totalBudget,
      totalAllocated,
      totalDisbursed,
      fundAvailable: totalAllocated - totalDisbursed,
      totalTasks: tasks.length,
      completedTasks,
      taskCompletionRate,
    };
  }, [projects, tasks]);

  // ============================================================
  // Senior Management / Progress Metrics
  // ============================================================
  const progressStats = useMemo(() => {
    const published = rawEntries.filter((e) => e.status === "published");
    const avgProgress =
      published.length > 0
        ? published.reduce((sum, e) => sum + e.progressPct, 0) / published.length
        : 0;
    const transformersCommissioned = published.reduce(
      (sum, e) => sum + e.transformersCommissioned,
      0
    );
    const transformersInstalled = published.reduce(
      (sum, e) => sum + e.transformersInstalled,
      0
    );
    const transformersTerminated = published.reduce(
      (sum, e) => sum + e.transformersTerminated,
      0
    );
    const transformersTested = published.reduce(
      (sum, e) => sum + e.transformersTested,
      0
    );
    const approvalRate =
      rawEntries.length > 0
        ? Math.round(
            ((rawEntries.filter((e) => e.status === "approved" || e.status === "published").length /
              rawEntries.filter((e) => e.status !== "draft").length) *
              100) || 0
          )
        : 0;

    return {
      publishedCount: published.length,
      submittedCount: rawEntries.filter((e) => e.status === "submitted").length,
      rejectedCount: rawEntries.filter((e) => e.status === "rejected").length,
      avgProgress,
      transformersCommissioned,
      transformersInstalled,
      transformersTerminated,
      transformersTested,
      approvalRate,
      uniqueEngineers: new Set(rawEntries.map((e) => e.siteEngineerId)).size,
    };
  }, [rawEntries]);

  // ============================================================
  // Chart Data
  // ============================================================
  // Histogram: Progress by Location
  const locationProgressData = useMemo(() => {
    const byLoc: Record<string, { pct: number; entries: number }> = {};
    for (const e of rawEntries.filter((x) => x.status === "published")) {
      if (!byLoc[e.locationId]) byLoc[e.locationId] = { pct: 0, entries: 0 };
      byLoc[e.locationId].pct += e.progressPct;
      byLoc[e.locationId].entries += 1;
    }
    return locations
      .map((loc) => {
        const data = byLoc[loc.id];
        return {
          name: loc.name.length > 12 ? loc.name.slice(0, 12) + "…" : loc.name,
          fullName: loc.name,
          progress: data ? Math.round((data.pct / data.entries) * 10) / 10 : 0,
          entries: data?.entries || 0,
        };
      })
      .filter((l) => l.entries > 0)
      .sort((a, b) => b.progress - a.progress);
  }, [rawEntries, locations]);

  // Pie Chart: Project Status Distribution
  const projectStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return (Object.keys(projectStatusLabels) as ProjectStatus[])
      .filter((s) => counts[s])
      .map((s) => ({
        name: projectStatusLabels[s],
        value: counts[s],
      }));
  }, [projects]);

  // Pie Chart: Transformer Pipeline
  const transformerPipelineData = useMemo(
    () => [
      { name: "Installed", value: progressStats.transformersInstalled },
      { name: "Terminated", value: progressStats.transformersTerminated },
      { name: "Tested", value: progressStats.transformersTested },
      { name: "Commissioned", value: progressStats.transformersCommissioned },
    ],
    [progressStats]
  );

  // Histogram: Budget vs Spent by Project
  const budgetData = useMemo(
    () =>
      projects.slice(0, 6).map((p) => ({
        name: p.code,
        fullName: p.name,
        budget: p.totalBudget,
        spent: p.budgetSummary?.totalSpent || 0,
      })),
    [projects]
  );

  const recentProjects = projects.slice(0, 5);

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar role={user?.role === "admin" ? "admin" : "senior_manager"} navItems={navItems} title="Senior Manager Portal" />

      <main className="container py-5 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
        >
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold text-brand-700 uppercase tracking-wider">
              {user?.role === "admin" ? "Executive & Admin View" : "Senior Manager View"}
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Unified Management Dashboard
            </h1>
            <p className="text-slate-500 text-xs">
              Welcome back, {user?.name.split(" ")[0]} · Projects, budgets, tasks & field progress
            </p>
          </div>
          <Link to="/hub-manager/projects" className="btn-primary">
            <FolderKanban className="w-4 h-4" />
            Manage Projects
          </Link>
        </motion.div>

        {/* ============================================================
            KPI STAT CARDS
        ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Total Projects"
            value={planningStats.totalProjects}
            subtitle={`${planningStats.activeProjects} active · ${planningStats.completedProjects} completed`}
            icon={<FolderKanban className="w-5 h-5" />}
            iconBg="bg-violet-50"
            iconColor="text-violet-700"
            delay={0}
          />
          <StatCard
            title="Overall Progress"
            value={`${progressStats.avgProgress.toFixed(1)}%`}
            subtitle={`Average across ${progressStats.publishedCount} published entries`}
            icon={<Gauge className="w-5 h-5" />}
            iconBg="bg-brand-50"
            iconColor="text-brand-700"
            trend={{ direction: "up", value: `${progressStats.uniqueEngineers} engineers active` }}
            delay={0.05}
          />
          <StatCard
            title="Funds Available"
            value={formatCurrency(planningStats.fundAvailable)}
            subtitle={`${formatCurrency(planningStats.totalDisbursed)} disbursed`}
            icon={<DollarSign className="w-5 h-5" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-700"
            delay={0.1}
          />
          <StatCard
            title="Data Approval Rate"
            value={`${progressStats.approvalRate}%`}
            subtitle={`${progressStats.publishedCount} published · ${progressStats.rejectedCount} rejected`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-700"
            delay={0.15}
          />
        </div>

        {/* ============================================================
            PROGRESS BARS & PIPELINE
        ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 card p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">
                  Project Progress at a Glance
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Financial, progress, and transformer completion metrics
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                <Activity className="w-3 h-3" />
                Live
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-end justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-700" />
                    <span className="text-xs font-semibold text-slate-700">Overall Field Progress</span>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-sm font-bold text-slate-900">
                      {progressStats.avgProgress.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">/ 100%</span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progressStats.avgProgress, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="h-full bg-gradient-to-r from-brand-600 to-brand-800 rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-end justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    <span className="text-xs font-semibold text-slate-700">Task Completion</span>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-sm font-bold text-slate-900">
                      {planningStats.taskCompletionRate}%
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">
                      {planningStats.completedTasks} / {planningStats.totalTasks} tasks
                    </span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${planningStats.taskCompletionRate}%` }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-violet-500 to-violet-700 rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-end justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-slate-700">Budget Utilization</span>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-sm font-bold text-slate-900">
                      {planningStats.totalBudget > 0
                        ? `${Math.min(Math.round((planningStats.totalDisbursed / planningStats.totalBudget) * 100), 100)}%`
                        : "0%"}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">
                      {formatCurrency(planningStats.totalDisbursed)} / {formatCurrency(planningStats.totalBudget)}
                    </span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${planningStats.totalBudget > 0 ? Math.min(Math.round((planningStats.totalDisbursed / planningStats.totalBudget) * 100), 100) : 0}%`,
                    }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className={`h-full rounded-full ${
                      planningStats.totalBudget > 0 && (planningStats.totalDisbursed / planningStats.totalBudget) * 100 < 70
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                        : planningStats.totalBudget > 0 && (planningStats.totalDisbursed / planningStats.totalBudget) * 100 < 90
                        ? "bg-gradient-to-r from-amber-400 to-amber-600"
                        : "bg-gradient-to-r from-rose-500 to-rose-700"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                Transformer Pipeline
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {transformerPipelineData.map((p, i) => {
                  const max = Math.max(...transformerPipelineData.map((x) => x.value), 1);
                  return (
                    <div key={p.name} className="rounded-xl border border-slate-200/60 p-2.5 text-center">
                      <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1">{p.name}</p>
                      <p className="font-display text-lg font-bold text-slate-900">{p.value}</p>
                      <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(p.value / max) * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.65 + i * 0.1 }}
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-700"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card p-4 space-y-3.5"
          >
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">
                Performance Snapshot
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Key live metrics</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Published</p>
                <p className="font-display text-lg font-bold text-slate-900 mt-0.5 leading-tight">{progressStats.publishedCount}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">verified records</p>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Pending</p>
                <p className="font-display text-lg font-bold text-amber-800 mt-0.5 leading-tight">{progressStats.submittedCount}</p>
                <p className="text-[10px] text-amber-700/80 mt-0.5">awaiting review</p>
              </div>
              <div className="rounded-xl bg-rose-50 border border-rose-200/60 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">Rejected</p>
                <p className="font-display text-lg font-bold text-rose-800 mt-0.5 leading-tight">{progressStats.rejectedCount}</p>
                <p className="text-[10px] text-rose-700/80 mt-0.5">sent back</p>
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-200/60 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Engineers</p>
                <p className="font-display text-lg font-bold text-emerald-800 mt-0.5 leading-tight">{progressStats.uniqueEngineers}</p>
                <p className="text-[10px] text-emerald-700/80 mt-0.5">active contributors</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/60 p-2.5 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Financial Summary</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Total Budget</span>
                <span className="font-mono text-xs font-bold text-slate-900">{formatCurrency(planningStats.totalBudget)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Allocated</span>
                <span className="font-mono text-xs font-bold text-emerald-700">{formatCurrency(planningStats.totalAllocated)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Available</span>
                <span className="font-mono text-xs font-bold text-amber-700">{formatCurrency(planningStats.fundAvailable)}</span>
              </div>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-brand-50 via-white to-violet-50 border border-brand-200/60 p-2.5">
              <div className="flex items-start gap-2">
                <Activity className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-brand-900">Key Insight</p>
                  <p className="text-[10px] text-brand-800/90 mt-0.5 leading-relaxed">
                    {progressStats.avgProgress >= 50
                      ? "Field progress is over halfway. Focus on commissioning to close the pipeline."
                      : "Field progress is ramping up. Monitor transformer testing workflows closely."}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ============================================================
            HISTOGRAMS & PIE CHARTS
        ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Histogram: Progress by Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-brand-700" />
                Progress by Location (%)
              </h2>
              <span className="text-[10px] text-slate-500">Published only</span>
            </div>
            {locationProgressData.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No published progress data yet.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationProgressData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, "Progress"]}
                      labelFormatter={(_, payload) => (payload && payload[0] ? payload[0].payload.fullName : "")}
                    />
                    <Bar dataKey="progress" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>

          {/* Pie Chart: Project Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-violet-700" />
                Project Status Distribution
              </h2>
              <span className="text-[10px] text-slate-500">{projects.length} projects</span>
            </div>
            {projectStatusData.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No projects yet.</p>
            ) : (
              <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ value }) => `${value}`}
                    >
                      {projectStatusData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [value, name]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Histogram: Budget vs Spent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-700" />
                Budget vs Spent by Project
              </h2>
              <span className="text-[10px] text-slate-500">Top {budgetData.length} projects</span>
            </div>
            {budgetData.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No budget data yet.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${Math.round(v / 1000000)}M`} />
                    <Tooltip
                      formatter={(value: number, name: string) => [formatCurrency(value), name === "budget" ? "Budget" : "Spent"]}
                      labelFormatter={(_, payload) => (payload && payload[0] ? payload[0].payload.fullName : "")}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="budget" fill="#10b981" radius={[4, 4, 0, 0]} name="Budget" />
                    <Bar dataKey="spent" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Spent" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>

          {/* Pie Chart: Transformer Pipeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-700" />
                Transformer Pipeline
              </h2>
              <span className="text-[10px] text-slate-500">Published entries</span>
            </div>
            {transformerPipelineData.every((d) => d.value === 0) ? (
              <p className="text-xs text-slate-500 py-8 text-center">No transformer data yet.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={transformerPipelineData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ value }) => `${value}`}
                    >
                      {transformerPipelineData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </div>

        {/* ============================================================
            RECENT PROJECTS & QUICK ACTIONS
        ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-violet-700" />
                Recent Projects
              </h2>
              <Link to="/hub-manager/projects" className="text-xs font-semibold text-violet-700 hover:text-violet-900 inline-flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading && projects.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                <Clock className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                Loading projects...
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                <FolderKanban className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No projects yet.
              </div>
            ) : (
              <div className="space-y-2">
                {recentProjects.map((project, i) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.05 }}
                  >
                    <Link
                      to={`/hub-manager/projects/${project.id}`}
                      className="block rounded-xl border border-slate-200/60 p-3 hover:border-violet-200/80 hover:bg-violet-50/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-[10px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">{project.code}</span>
                            <span className={`status-pill ${statusColors[project.status]}`}>{projectStatusLabels[project.status]}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-900 truncate">{project.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {project.scopeCount || 0} scopes · {project.taskSummary?.totalTasks || 0} tasks · {formatCurrency(project.totalBudget)}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="card p-4 space-y-3"
          >
            <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/hub-manager/projects" className="flex items-center gap-3 rounded-xl border border-slate-200/60 p-3 hover:border-violet-200/80 hover:bg-violet-50/30 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center shrink-0">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">Manage Projects</p>
                  <p className="text-[10px] text-slate-500">Create and configure projects</p>
                </div>
              </Link>
              <Link to="/hub-manager/assets" className="flex items-center gap-3 rounded-xl border border-slate-200/60 p-3 hover:border-emerald-200/80 hover:bg-emerald-50/30 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Network className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">Network Assets</p>
                  <p className="text-[10px] text-slate-500">Lines, branches, transformers</p>
                </div>
              </Link>
              <Link to="/hub-manager/monitor" className="flex items-center gap-3 rounded-xl border border-slate-200/60 p-3 hover:border-amber-200/80 hover:bg-amber-50/30 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">Progress Monitor</p>
                  <p className="text-[10px] text-slate-500">Track progress vs plans</p>
                </div>
              </Link>
              <Link to="/senior-manager/records" className="flex items-center gap-3 rounded-xl border border-slate-200/60 p-3 hover:border-brand-200/80 hover:bg-brand-50/30 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">Published Records</p>
                  <p className="text-[10px] text-slate-500">View verified field data</p>
                </div>
              </Link>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-brand-50 via-white to-violet-50 border border-brand-200/60 p-3">
              <div className="flex items-start gap-2">
                <ListChecks className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-brand-900">Unified Workflow</p>
                  <p className="text-[10px] text-brand-800/90 mt-0.5 leading-relaxed">
                    1. Plan projects → 2. Allocate budget → 3. Assign tasks → 4. Field progress → 5. Verify & publish
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}