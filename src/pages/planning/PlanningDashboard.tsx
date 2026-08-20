import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Network,
  ListChecks,
  TrendingUp,
  ArrowRight,
  Activity,
  CheckCircle2,
  Clock,
  FileCheck2,
  Send,
  Inbox,
  BarChart3,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useProgressStore } from "@/store/progressStore";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";

const navItems = [
  { label: "Dashboard", path: "/hub-manager", icon: <LayoutDashboard className="w-4 h-4" /> },
  // { label: "Projects", path: "/hub-manager/projects", icon: <ListChecks className="w-4 h-4" /> },
  { label: "Network Assets", path: "/hub-manager/assets", icon: <Network className="w-4 h-4" /> },
  { label: "Progress Monitor", path: "/hub-manager/monitor", icon: <TrendingUp className="w-4 h-4" /> },
];

export default function PlanningDashboard() {
  const { user } = useAuthStore();
  const { entries: progressEntries, fetchEntries } = useProgressStore();

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const stats = useMemo(() => {
    const approved = progressEntries.filter((entry) => ["approved", "published"].includes(entry.status));
    const submitted = progressEntries.filter((entry) => entry.status === "submitted");
    const averageProgress = progressEntries.length > 0
      ? Math.round(progressEntries.reduce((sum, entry) => sum + entry.progressPct, 0) / progressEntries.length)
      : 0;
    const transformersCommissioned = progressEntries.reduce(
      (sum, entry) => sum + entry.transformersCommissioned,
      0
    );
    return {
      totalEntries: progressEntries.length,
      approvedEntries: approved.length,
      submittedEntries: submitted.length,
      averageProgress,
      transformersCommissioned,
    };
  }, [progressEntries]);

  const pendingReviews = useMemo(
    () =>
      [...progressEntries]
        .filter((e) => e.status === "submitted")
        .sort(
          (a, b) =>
            new Date(a.submittedAt || a.createdAt).getTime() -
            new Date(b.submittedAt || b.createdAt).getTime()
        ),
    [progressEntries]
  );

  const recentEntries = [...progressEntries]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar role="hub_manager" navItems={navItems} title="Hub Manager Portal" />

      <main className="container py-5 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
        >
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold text-violet-700 uppercase tracking-wider">
              Hub Manager Department
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Progress Dashboard
            </h1>
            <p className="text-slate-500 text-xs">
              Welcome back, {user?.name.split(" ")[0]} · Track field progress and review submissions
            </p>
          </div>

          {/* <Link
            to="/hub-manager/projects"
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link> */}
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard
            title="Progress Entries"
            value={stats.totalEntries}
            subtitle={`${stats.submittedEntries} awaiting review`}
            icon={<BarChart3 className="w-5 h-5" />}
            iconBg="bg-violet-50"
            iconColor="text-violet-700"
            trend={{ direction: stats.submittedEntries > 0 ? "down" : "up", value: stats.submittedEntries > 0 ? "Review needed" : "All reviewed" }}
            delay={0}
          />
          <StatCard
            title="Average Progress"
            value={`${stats.averageProgress}%`}
            subtitle="Across all field entries"
            icon={<TrendingUp className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-700"
            trend={{ direction: stats.averageProgress >= 50 ? "up" : "down", value: stats.averageProgress >= 50 ? "On track" : "Needs focus" }}
            delay={0.05}
          />
          <StatCard
            title="Approved Entries"
            value={stats.approvedEntries}
            subtitle="Approved or published"
            icon={<CheckCircle2 className="w-5 h-5" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-700"
            trend={
              { direction: "up", value: "Verified progress" }
            }
            delay={0.1}
          />
          <StatCard
            title="Transformers Commissioned"
            value={stats.transformersCommissioned}
            subtitle="Reported in field entries"
            icon={<Zap className="w-5 h-5" />}
            iconBg="bg-blue-50"
            iconColor="text-blue-700"
            trend={{ direction: "up", value: "Field output" }}
            delay={0.15}
          />
          <StatCard
            title="Pending Reviews"
            value={pendingReviews.length}
            subtitle="Progress entries awaiting your review"
            icon={<Inbox className="w-5 h-5" />}
            iconBg="bg-rose-50"
            iconColor="text-rose-700"
            trend={
              pendingReviews.length === 0
                ? { direction: "up", value: "All caught up" }
                : { direction: "down", value: "Needs attention" }
            }
            delay={0.2}
          />
        </div>

        {/* ── Pending Reviews ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="card p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-rose-700" />
                Pending Reviews
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Progress entries submitted by Branch Managers, awaiting your approval
              </p>
            </div>
            <Link
              to="/hub-manager/monitor"
              className="text-xs font-semibold text-violet-700 hover:text-violet-900 inline-flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {pendingReviews.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No entries waiting on review. You're all caught up.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingReviews.slice(0, 6).map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                >
                  <Link
                    to={`/hub-manager/review/${entry.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/60 p-3 hover:border-rose-200/80 hover:bg-rose-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                        <Send className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            #{entry.id.slice(-8).toUpperCase()}
                          </p>
                          <StatusBadge status={entry.status} />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {entry.siteEngineerName || "Unknown Branch Manager"} ·{" "}
                          {entry.progressPct.toFixed(1)}% progress ·{" "}
                          {new Date(entry.submittedAt || entry.entryDate).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                </motion.div>
              ))}
              {pendingReviews.length > 6 && (
                <Link
                  to="/hub-manager/monitor"
                  className="block text-center text-xs font-semibold text-violet-700 hover:text-violet-900 pt-1"
                >
                  +{pendingReviews.length - 6} more awaiting review
                </Link>
              )}
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-2 card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-violet-700" />
                Recent Progress Entries
              </h2>
              <Link
                to="/hub-manager/monitor"
                className="text-xs font-semibold text-violet-700 hover:text-violet-900 inline-flex items-center gap-1"
              >
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentEntries.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                <Clock className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                No progress entries have been submitted yet.
              </div>
            ) : (
              <div className="space-y-2">
                {recentEntries.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <Link
                      to={`/hub-manager/review/${entry.id}`}
                      className="block rounded-xl border border-slate-200/60 p-3 hover:border-violet-200/80 hover:bg-violet-50/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-[10px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">
                              #{entry.id.slice(-8).toUpperCase()}
                            </span>
                            <StatusBadge status={entry.status} />
                          </div>
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {entry.siteEngineerName || "Unknown Site Engineer"}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {entry.progressPct.toFixed(1)}% progress · {entry.transformersCommissioned} transformers commissioned · {new Date(entry.entryDate).toLocaleDateString("en-GB")}
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
            transition={{ delay: 0.3 }}
            className="card p-4 space-y-3"
          >
            <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                to="/hub-manager/monitor"
                className="flex items-center gap-3 rounded-xl border border-slate-200/60 p-3 hover:border-violet-200/80 hover:bg-violet-50/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">Monitor Progress</p>
                  <p className="text-[10px] text-slate-500">Compare progress against plans</p>
                </div>
              </Link>
              <Link
                to="/hub-manager/assets"
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
                to="/hub-manager/monitor"
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