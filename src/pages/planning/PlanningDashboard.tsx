import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  Network,
  Wallet,
  ListChecks,
  TrendingUp,
  Plus,
  ArrowRight,
  Activity,
  DollarSign,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useManagementStore } from "@/store/managementStore";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { projectStatusLabels } from "@/types";
import type { ProjectStatus } from "@/types";

const navItems = [
  { label: "Dashboard", path: "/planning", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Projects", path: "/planning/projects", icon: <FolderKanban className="w-4 h-4" /> },
  { label: "Network Assets", path: "/planning/assets", icon: <Network className="w-4 h-4" /> },
  { label: "Progress Monitor", path: "/planning/monitor", icon: <TrendingUp className="w-4 h-4" /> },
];

const statusColors: Record<ProjectStatus, string> = {
  planning: "bg-slate-100 text-slate-700",
  active: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export default function PlanningDashboard() {
  const { user } = useAuthStore();
  const { projects, fetchProjects, loading } = useManagementStore();
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const stats = useMemo(() => {
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
    const totalTasks = projects.reduce(
      (sum, p) => sum + (p.taskSummary?.totalTasks || 0),
      0
    );
    const completedTasks = projects.reduce(
      (sum, p) => sum + (p.taskSummary?.completedTasks || 0),
      0
    );

    return {
      totalProjects: projects.length,
      activeProjects: active.length,
      completedProjects: completed.length,
      totalBudget,
      totalAllocated,
      totalDisbursed,
      fundAvailable: totalAllocated - totalDisbursed,
      totalTasks,
      completedTasks,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [projects]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "RWF",
      maximumFractionDigits: 0,
    }).format(n);

  const recentProjects = projects.slice(0, 5);

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar role="planning" navItems={navItems} title="Management Portal" />

      <main className="container py-5 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
        >
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold text-violet-700 uppercase tracking-wider">
              Planning Department
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Management Portal
            </h1>
            <p className="text-slate-500 text-xs">
              Welcome back, {user?.name.split(" ")[0]} · Manage projects, scopes, budgets, and tasks
            </p>
          </div>

          <Link
            to="/planning/projects"
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Total Projects"
            value={stats.totalProjects}
            subtitle={`${stats.activeProjects} active · ${stats.completedProjects} completed`}
            icon={<FolderKanban className="w-5 h-5" />}
            iconBg="bg-violet-50"
            iconColor="text-violet-700"
            trend={{ direction: "up", value: `${stats.activeProjects} active now` }}
            delay={0}
          />
          <StatCard
            title="Total Budget"
            value={formatCurrency(stats.totalBudget)}
            subtitle="Across all projects"
            icon={<Wallet className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-700"
            trend={{ direction: "up", value: "Budget allocated" }}
            delay={0.05}
          />
          <StatCard
            title="Funds Available"
            value={formatCurrency(stats.fundAvailable)}
            subtitle={`${formatCurrency(stats.totalDisbursed)} disbursed`}
            icon={<DollarSign className="w-5 h-5" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-700"
            trend={
              stats.fundAvailable > stats.totalDisbursed
                ? { direction: "up", value: "Healthy" }
                : { direction: "down", value: "Monitor" }
            }
            delay={0.1}
          />
          <StatCard
            title="Task Completion"
            value={`${stats.taskCompletionRate}%`}
            subtitle={`${stats.completedTasks} of ${stats.totalTasks} tasks done`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            iconBg="bg-blue-50"
            iconColor="text-blue-700"
            trend={{ direction: "up", value: "On track" }}
            delay={0.15}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-violet-700" />
                Recent Projects
              </h2>
              <Link
                to="/planning/projects"
                className="text-xs font-semibold text-violet-700 hover:text-violet-900 inline-flex items-center gap-1"
              >
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
                No projects yet. Create your first project to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {recentProjects.map((project, i) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                  >
                    <Link
                      to={`/planning/projects/${project.id}`}
                      className="block rounded-xl border border-slate-200/60 p-3 hover:border-violet-200/80 hover:bg-violet-50/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-[10px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">
                              {project.code}
                            </span>
                            <span className={`status-pill ${statusColors[project.status]}`}>
                              {projectStatusLabels[project.status]}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {project.name}
                          </p>
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
            transition={{ delay: 0.25 }}
            className="card p-4 space-y-3"
          >
            <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                to="/planning/projects"
                className="flex items-center gap-3 rounded-xl border border-slate-200/60 p-3 hover:border-violet-200/80 hover:bg-violet-50/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center shrink-0">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">Manage Projects</p>
                  <p className="text-[10px] text-slate-500">Create and configure projects</p>
                </div>
              </Link>
              <Link
                to="/planning/assets"
                className="flex items-center gap-3 rounded-xl border border-slate-200/60 p-3 hover:border-violet-200/80 hover:bg-violet-50/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Network className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">Network Assets</p>
                  <p className="text-[10px] text-slate-500">Lines, branches, transformers</p>
                </div>
              </Link>
              <Link
                to="/planning/monitor"
                className="flex items-center gap-3 rounded-xl border border-slate-200/60 p-3 hover:border-violet-200/80 hover:bg-violet-50/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">Progress Monitor</p>
                  <p className="text-[10px] text-slate-500">Track progress vs plans</p>
                </div>
              </Link>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-violet-50 via-white to-emerald-50 border border-violet-200/60 p-3">
              <div className="flex items-start gap-2">
                <ListChecks className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-violet-900">Planning Workflow</p>
                  <p className="text-[10px] text-violet-800/90 mt-0.5 leading-relaxed">
                    1. Create project → 2. Define scopes → 3. Allocate budget → 4. Assign tasks → 5. Monitor progress
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