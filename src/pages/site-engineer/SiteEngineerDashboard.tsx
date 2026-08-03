import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileEdit,
  History,
  Zap,
  FileCheck2,
  Send,
  FileX2,
  Gauge,
  CheckCircle2,
  ArrowRight,
  Clock,
  FileQuestion,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useProgressStore } from "@/store/progressStore";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useMasterDataStore } from "@/store/masterDataStore";

const navItems = [
  { label: "Dashboard", path: "/site-engineer", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "New Entry", path: "/site-engineer/entry", icon: <FileEdit className="w-4 h-4" /> },
  { label: "History", path: "/site-engineer/history", icon: <History className="w-4 h-4" /> },
];

export default function SiteEngineerDashboard() {
  const { user } = useAuthStore();
  const engineerId = user?.id ?? "";
  const allEntries = useProgressStore((s) => s.entries);
  const { getLocationName, getLineName } = useMasterDataStore();
  const { fetchEntries } = useProgressStore();
  const { fetchAll, initialized: masterInitialized } = useMasterDataStore();

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    if (!masterInitialized) {
      fetchAll();
    }
  }, [fetchAll, masterInitialized]);

  const entries = useMemo(
    () =>
      allEntries
        .filter((e) => e.siteEngineerId === engineerId)
        .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()),
    [allEntries, engineerId]
  );

  const stats = useMemo(() => {
    return {
      total: entries.length,
      draft: entries.filter((e) => e.status === "draft").length,
      submitted: entries.filter((e) => e.status === "submitted").length,
      published: entries.filter((e) => e.status === "published").length,
      rejected: entries.filter((e) => e.status === "rejected").length,
      totalKm: entries.reduce((sum, e) => sum + e.completedKm, 0),
      transformersCommissioned: entries.reduce(
        (sum, e) => sum + e.transformersCommissioned,
        0
      ),
    };
  }, [entries]);

  const recentEntries = entries.slice(0, 5);
  const needsAttention = entries.filter((e) => e.status === "rejected" || e.status === "draft");

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar role="site_engineer" navItems={navItems} title="Site Engineer Portal" />

      <main className="container py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
        >
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-brand-700">
              Welcome back, {user?.name.split(" ")[0]} 👋
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Daily Progress Dashboard
            </h1>
            <p className="text-slate-500 text-xs">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {user?.branch && ` · ${user.branch}`}
            </p>
          </div>
          <Link to="/site-engineer/entry" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-800 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-700 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed">
            <FileEdit className="w-4 h-4" />
            Add New Progress Entry
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Total Entries"
            value={stats.total}
            subtitle={`${Math.round((stats.total / 30) * 7)} this week`}
            icon={<FileCheck2 className="w-4 h-4" />}
            iconBg="bg-brand-50"
            iconColor="text-brand-700"
            delay={0.05}
          />
          <StatCard
            title="Submitted"
            value={stats.submitted}
            subtitle="Awaiting review"
            icon={<Send className="w-4 h-4" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-700"
            delay={0.1}
          />
          <StatCard
            title="Published"
            value={stats.published}
            subtitle="Verified by manager"
            icon={<CheckCircle2 className="w-4 h-4" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-700"
            delay={0.15}
          />
          <StatCard
            title="Rejected"
            value={stats.rejected}
            subtitle={needsAttention.length > 0 ? "Needs revision" : undefined}
            icon={<FileX2 className="w-4 h-4" />}
            iconBg="bg-rose-50"
            iconColor="text-rose-700"
            delay={0.2}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 card p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  Site Progress Overview
                </h2>
                <p className="text-xs text-slate-500">
                  Aggregate work completed across all entries
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-semibold">
                <Zap className="w-3 h-3 text-brand-600" />
                All Projects
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-brand-50 via-white to-brand-50 border border-brand-100 p-4">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Gauge className="w-3.5 h-3.5 text-brand-700" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    Cable Completed
                  </p>
                </div>
                <p className="font-display text-3xl font-bold text-brand-900 leading-tight tracking-tight">
                  {stats.totalKm.toFixed(2)}
                  <span className="ml-1 text-sm font-semibold text-brand-700">
                    km
                  </span>
                </p>
                <div className="mt-2 h-1.5 w-full bg-white/80 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stats.totalKm / 50) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-700 rounded-full"
                  />
                </div>
                <p className="text-[11px] text-brand-600 mt-1.5 font-medium">
                  Target: 50.00 km total
                </p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50 border border-emerald-100 p-4">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                    Transformers Commissioned
                  </p>
                </div>
                <p className="font-display text-3xl font-bold text-emerald-900 leading-tight tracking-tight">
                  {stats.transformersCommissioned}
                  <span className="ml-1 text-sm font-semibold text-emerald-700">
                    units
                  </span>
                </p>
                <div className="mt-2 h-1.5 w-full bg-white/80 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(
                        (stats.transformersCommissioned / 20) * 100,
                        100
                      )}%`,
                    }}
                    transition={{ duration: 1, delay: 0.7 }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-full"
                  />
                </div>
                <p className="text-[11px] text-emerald-600 mt-1.5 font-medium">
                  Target: 20 units total
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card p-5 space-y-3.5"
          >
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Quick Actions
              </h2>
              <p className="text-xs text-slate-500">
                Common tasks for today
              </p>
            </div>

            <div className="space-y-2">
              <Link
                to="/site-engineer/entry"
                className="group flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-brand-50 to-white border border-brand-100 hover:border-brand-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                  <FileEdit className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-xs">
                    Submit Today's Progress
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Record completed work for today
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-700 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/site-engineer/history"
                className="group flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-700 text-white shadow-sm group-hover:scale-105 transition-transform">
                  <History className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-xs">
                    View Submission History
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Track status of all your entries
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {needsAttention.length > 0 && (
                <Link
                  to="/site-engineer/history"
                  className="group flex items-center gap-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 hover:border-rose-300 hover:shadow-md transition-all animate-pulse"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                    <FileX2 className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-rose-800 text-xs">
                      {needsAttention.length} Entries Need Attention
                    </p>
                    <p className="text-[11px] text-rose-600">
                      Revise rejected or complete draft entries
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-rose-400 group-hover:text-rose-700 group-hover:translate-x-0.5 transition-all" />
                </Link>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5 space-y-4"
        >
          <div className="flex items-center justify-between flex-wrap gap-2.5">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Recent Submissions
              </h2>
              <p className="text-xs text-slate-500">
                Your latest progress entries and their status
              </p>
            </div>
            <Link to="/site-engineer/history" className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 text-brand-700 hover:bg-brand-50">
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto -mx-5 px-5 scrollbar-thin">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 pb-2.5 pr-3">
                    Date
                  </th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 pb-2.5 pr-3">
                    Location / Line
                  </th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 pb-2.5 pr-3">
                    Completed (km)
                  </th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 pb-2.5 pr-3">
                    TRSFO Status
                  </th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 pb-2.5">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileQuestion className="w-9 h-9 text-slate-300" />
                        <p className="text-xs font-medium text-slate-500">
                          No entries yet
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Submit your first progress entry to get started
                        </p>
                        <Link
                          to="/site-engineer/entry"
                          className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-800 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-700"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          Create First Entry
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentEntries.map((entry, i) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45 + i * 0.05 }}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 leading-tight">
                              {new Date(entry.entryDate).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {new Date(entry.createdAt).toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <p className="text-xs font-semibold text-slate-800 leading-tight">
                          {getLocationName(entry.locationId)}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9px]">
                            {entry.voltageLevel}
                          </span>
                          {getLineName(entry.lineId)}
                        </p>
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <p className="font-display text-sm font-bold text-brand-800">
                          {entry.completedKm.toFixed(2)}
                        </p>
                        <p className="text-[11px] text-slate-500">kilometers</p>
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <p className="text-xs font-semibold text-slate-800 leading-tight">
                          {entry.transformersInstalled > 0 && (
                            <span className="text-slate-600">
                              I:{entry.transformersInstalled}{" "}
                            </span>
                          )}
                          {entry.transformersTerminated > 0 && (
                            <span className="text-blue-700">
                              T:{entry.transformersTerminated}{" "}
                            </span>
                          )}
                          {entry.transformersTested > 0 && (
                            <span className="text-amber-700">
                              Te:{entry.transformersTested}{" "}
                            </span>
                          )}
                          {entry.transformersCommissioned > 0 && (
                            <span className="text-emerald-700 font-bold">
                              C:{entry.transformersCommissioned}
                            </span>
                          )}
                          {entry.transformersInstalled === 0 &&
                            entry.transformersTerminated === 0 &&
                            entry.transformersTested === 0 &&
                            entry.transformersCommissioned === 0 && (
                              <span className="text-slate-400">—</span>
                            )}
                        </p>
                      </td>
                      <td className="py-3">
                        <StatusBadge status={entry.status} />
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
