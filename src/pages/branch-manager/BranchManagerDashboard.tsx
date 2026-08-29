import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileCheck2,
  Eye,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  Send,
  Zap,
  FileCheck,
  FileX2,
  CheckCircle2,
  Gauge,
  ArrowRight,
  Clock,
  FileQuestion,
  Users,
  CalendarDays,
  User as UserIcon,
  Building2,
  MapPin,
  FileEdit,
  History,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useProgressStore } from "@/store/progressStore";
import { useMasterDataStore } from "@/store/masterDataStore";
import { useManagementStore } from "@/store/managementStore";
import { useHubStore } from "@/store/hubStore";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";

const navItems = [
  {
    label: "Dashboard",
    path: "/branch-manager",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: "New Entry",
    path: "/branch-manager/entry",
    icon: <FileEdit className="w-4 h-4" />,
  },
  {
    label: "My History",
    path: "/branch-manager/history",
    icon: <History className="w-4 h-4" />,
  },
  {
    label: "Approved Scopes",
    path: "/branch-manager/scopes",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  {
    label: "Pending Reviews",
    path: "/branch-manager#pending",
    icon: <ClipboardList className="w-4 h-4" />,
  },
  {
    label: "Published",
    path: "/branch-manager/published",
    icon: <BookOpen className="w-4 h-4" />,
  },
];

export default function BranchManagerDashboard() {
  const { user } = useAuthStore();
  const rawEntries = useProgressStore((s) => s.entries);
  const scopes = useManagementStore((s) => s.scopes);
  const { getLocationName, getLineName, branches } = useMasterDataStore();
  const { fetchEntries } = useProgressStore();
  const { fetchScopes } = useManagementStore();
  const { fetchAll, initialized: masterInitialized } = useMasterDataStore();
  const { fetchHubs, getHubName, initialized: hubsInitialized } = useHubStore();

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    fetchScopes();
  }, [fetchScopes]);

  useEffect(() => {
    if (!masterInitialized) fetchAll();
  }, [fetchAll, masterInitialized]);

  useEffect(() => {
    if (!hubsInitialized) fetchHubs();
  }, [fetchHubs, hubsInitialized]);

  const hubName = user?.hubId ? getHubName(user.hubId) : (user?.hubName ?? "Your Hub");

  const stats = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekEntries = rawEntries.filter(
      (e) => new Date(e.entryDate) >= oneWeekAgo
    );
    return {
      pending: rawEntries.filter((e) => e.status === "submitted").length,
      published: rawEntries.filter((e) => e.status === "published").length,
      rejected: rawEntries.filter((e) => e.status === "rejected").length,
      totalThisWeek: thisWeekEntries.length,
      avgProgress:
        rawEntries.length > 0
          ? rawEntries.reduce((sum, e) => sum + e.progressPct, 0) /
            rawEntries.length
          : 0,
      transformersCommissioned: rawEntries.reduce(
        (sum, e) => sum + e.transformersCommissioned,
        0
      ),
    };
  }, [rawEntries]);

  const pendingEntries = useMemo(
    () =>
      [...rawEntries]
        .filter((e) => e.status === "submitted")
        .sort(
          (a, b) =>
            new Date(a.submittedAt || a.createdAt).getTime() -
            new Date(b.submittedAt || b.createdAt).getTime()
        ),
    [rawEntries]
  );

  const branchApprovedScopes = useMemo(
    () => {
      const branchName = user?.branch?.trim().toLowerCase();
      const branchId = branches.find(
        (branch) => {
          const masterBranchName = branch.name.trim().toLowerCase();
          return (
            masterBranchName === branchName ||
            masterBranchName === `${branchName} branch`
          );
        }
      )?.id;

      return scopes.filter((scope) => {
        if (scope.status !== "approved") return false;
        if (branchName) {
          return (
            scope.branchId === branchId ||
            scope.branchName?.trim().toLowerCase() === branchName ||
            scope.branchName?.trim().toLowerCase() === `${branchName} branch`
          );
        }
        return scope.hubId === user?.hubId;
      });
    },
    [scopes, user, branches]
  );

  const publishedRecent = useMemo(
    () =>
      [...rawEntries]
        .filter((e) => e.status === "published")
        .sort(
          (a, b) =>
            new Date(b.publishedAt || b.updatedAt).getTime() -
            new Date(a.publishedAt || a.updatedAt).getTime()
        )
        .slice(0, 4),
    [rawEntries]
  );

  const pendingToShow = pendingEntries.slice(0, 6);

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar
        role="branch_manager"
        navItems={navItems}
        title="Branch Manager Portal"
      />

      <main className="container py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-emerald-700">
                Welcome back, {user?.name.split(" ")[0]} 👋
              </p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[10px] font-bold">
                <Building2 className="w-3 h-3" />
                {hubName}
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
              Branch Dashboard
            </h1>
            <p className="text-slate-500 text-sm">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {user?.branch && ` · Branch: ${user.branch}`}
            </p>
          </div>
          {pendingEntries.length > 0 && (
            <Link
              to="#pending"
              className="btn-primary animate-pulse"
            >
              <ClipboardList className="w-4.5 h-4.5" />
              {pendingEntries.length} Pending{pendingEntries.length > 1 ? "s" : ""} to Review
            </Link>
          )}
        </motion.div>

        
          <h2 className="font-display text-lg font-bold text-slate-900">
                  Summary overview
                </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard
            title="Pending Review"
            value={stats.pending}
            subtitle="Awaiting your action"
            icon={<ClipboardList className="w-5 h-5" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-700"
            delay={0.05}
          />
          <StatCard
            title="Published"
            value={stats.published}
            subtitle="All-time verified"
            icon={<CheckCircle2 className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-700"
            delay={0.1}
          />
          <StatCard
            title="Rejected"
            value={stats.rejected}
            subtitle="Sent back for revision"
            icon={<FileX2 className="w-5 h-5" />}
            iconBg="bg-rose-50"
            iconColor="text-rose-700"
            delay={0.15}
          />
          {/* <StatCard
            title="This Week"
            value={stats.totalThisWeek}
            subtitle="Total entries processed"
            icon={<CalendarDays className="w-5 h-5" />}
            iconBg="bg-brand-50"
            iconColor="text-brand-700"
            delay={0.2}
          /> */}
        </div>
        
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">Assigned Approved Scopes</h2>
              <p className="text-sm text-slate-500">Approved work packages ready for branch execution and reporting</p>
            </div>
            <Link to="/branch-manager/scopes" className="btn-secondary text-sm">
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {branchApprovedScopes.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No approved scopes assigned to this branch yet.
              </div>
            ) : (
              branchApprovedScopes.slice(0, 3).map((scope) => (
                <div key={scope.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-800 leading-tight">{scope.name}</p>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Approved</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">{scope.branchName || "Branch scope"}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600">
                    <span>{scope.lineName || "Line —"}</span>
                    <span>{scope.transformerName || "TRSFO —"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 card p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Aggregate Progress Verified
                </h2>
                <p className="text-sm text-slate-500">
                  Cumulative project metrics across all published entries
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                All Engineers
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50 border border-emerald-100 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Gauge className="w-4 h-4 text-emerald-700" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Average Progress
                  </p>
                </div>
                <p className="font-display text-4xl font-bold text-emerald-900 leading-tight tracking-tight">
                  {stats.avgProgress.toFixed(1)}
                  <span className="ml-1.5 text-lg font-semibold text-emerald-700">
                    %
                  </span>
                </p>
                <div className="mt-3 h-2 w-full bg-white/80 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(stats.avgProgress, 100)}%`,
                    }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-full"
                  />
                </div>
                <p className="text-xs text-emerald-600 mt-2 font-medium">
                  Average across {rawEntries.length} entries
                </p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-brand-50 via-white to-brand-50 border border-brand-100 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-brand-700 fill-current" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Transformers Commissioned
                  </p>
                </div>
                <p className="font-display text-4xl font-bold text-brand-900 leading-tight tracking-tight">
                  {stats.transformersCommissioned}
                  <span className="ml-1.5 text-lg font-semibold text-brand-700">
                    units
                  </span>
                </p>
                <div className="mt-3 h-2 w-full bg-white/80 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(
                        (stats.transformersCommissioned / 20) * 100,
                        100
                      )}%`,
                    }}
                    transition={{ duration: 1, delay: 0.7 }}
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-800 rounded-full"
                  />
                </div>
                <p className="text-xs text-brand-600 mt-2 font-medium">
                  {((stats.transformersCommissioned / 20) * 100).toFixed(0)}% of 20 unit target
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                // {
                //   label: "Unique Engineers",
                //   value: 2,
                //   icon: <Users className="w-4 h-4" />,
                //   bg: "bg-violet-50",
                //   color: "text-violet-700",
                // },
                // {
                //   label: "Active Locations",
                //   value: 5,
                //   icon: <ShieldCheck className="w-4 h-4" />,
                //   bg: "bg-orange-50",
                //   color: "text-orange-700",
                // },
                // {
                //   label: "Rejection Rate",
                //   value:
                //     stats.published + stats.rejected > 0
                //       ? `${(
                //           (stats.rejected / (stats.published + stats.rejected)) *
                //           100
                //         ).toFixed(0)}%`
                //       : "0%",
                //   icon: <Send className="w-4 h-4" />,
                //   bg: "bg-slate-100",
                //   color: "text-slate-700",
                // },
              ].map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + i * 0.05 }}
                  className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3"
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-xl ${m.bg} ${m.color} shadow-inner shrink-0`}
                  >
                    {m.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {m.label}
                    </p>
                    <p className="font-display text-xl font-bold text-slate-900 leading-tight">
                      {m.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card p-6 space-y-4"
          >
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Recently Published
              </h2>
              <p className="text-sm text-slate-500">Latest verified entries</p>
            </div>

            <div className="space-y-2.5">
              {publishedRecent.length === 0 ? (
                <div className="py-8 text-center">
                  <FileCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No published entries yet</p>
                </div>
              ) : (
                publishedRecent.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="p-3 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 leading-tight">
                          {getLocationName(entry.locationId)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {getLineName(entry.lineId)}
                        </p>
                      </div>
                      <span className="p-1.5 rounded-lg text-slate-300 bg-slate-100/80">
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-emerald-700 font-semibold">
                        {entry.progressPct.toFixed(1)}% · {entry.transformersCommissioned}C
                      </p>
                      {entry.siteEngineerName && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <UserIcon className="w-3 h-3" />
                          {entry.siteEngineerName.split(" ")[0]}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <Link
              to="/branch-manager/published"
              className="btn-ghost w-full justify-center text-sm bg-slate-50 border border-slate-200"
            >
              View All Published
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        <motion.section
          id="pending"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card p-6 space-y-5"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-11 h-11 rounded-2xl shadow-inner ${
                  pendingEntries.length > 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Pending Review Queue
                </h2>
                <p className="text-sm text-slate-500">
                  {pendingEntries.length > 0
                    ? `${pendingEntries.length} ${pendingEntries.length > 1 ? "entries" : "entry"} awaiting your validation before publishing`
                    : "All caught up — no entries pending review"}
                </p>
              </div>
            </div>
            {pendingEntries.length > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-800 text-xs font-bold animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                {pendingEntries.length} pending
              </div>
            )}
          </div>

          <div className="overflow-x-auto -mx-6 px-6 scrollbar-thin">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 pr-4">
                    Submitted
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 pr-4">
                    Site Engineer
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 pr-4">
                    Location / Line / TRSFO
                  </th>
                  <th className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 pr-4">
                    Progress
                  </th>
                  <th className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 pr-4">
                    Status
                  </th>
                  <th className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingToShow.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2.5 max-w-md mx-auto">
                        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600">
                          <FileCheck2 className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-semibold text-slate-600">
                          All entries reviewed!
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          There are no submissions pending your approval at the moment.
                          Check back later or view the published records archive.
                        </p>
                        <Link
                          to="/branch-manager/published"
                          className="mt-2 btn-secondary text-sm py-2 px-4"
                        >
                          <BookOpen className="w-4 h-4" />
                          View Published Records
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pendingToShow.map((entry, i) => {
                    const isOld =
                      entry.submittedAt &&
                      new Date().getTime() -
                        new Date(entry.submittedAt).getTime() >
                        2 * 86400000;
                    return (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.05 }}
                        className={`transition-colors ${
                          isOld
                            ? "bg-rose-50/50 hover:bg-rose-50"
                            : "hover:bg-slate-50/60"
                        }`}
                      >
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${
                                isOld
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              <Clock className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 leading-tight">
                                {entry.submittedAt
                                  ? new Date(entry.submittedAt).toLocaleDateString(
                                      "en-GB",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                      }
                                    )
                                  : "N/A"}
                              </p>
                              <p className="text-xs text-slate-500">
                                {entry.submittedAt
                                  ? new Date(entry.submittedAt).toLocaleTimeString(
                                      "en-GB",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )
                                  : ""}
                              </p>
                              {isOld && (
                                <p className="text-[11px] font-semibold text-rose-600 mt-0.5">
                                  ⚠ Overdue — 2+ days
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 border border-brand-200/50 shrink-0">
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 leading-tight">
                                {entry.siteEngineerName}
                              </p>
                              <p className="text-xs text-slate-500">
                                Entry for:{" "}
                                {new Date(entry.entryDate).toLocaleDateString(
                                  "en-GB"
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4 align-top">
                          <p className="text-sm font-semibold text-slate-800 leading-tight">
                            📍 {getLocationName(entry.locationId)}
                          </p>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9px] font-bold">
                              {entry.voltageLevel}
                            </span>
                            <span className="text-xs text-slate-500">
                              {getLineName(entry.lineId)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            ⚡ {useMasterDataStore.getState().getTransformerName(entry.transformerId)}
                          </p>
                        </td>
                        <td className="py-4 pr-4 text-right">
                          <p className="font-display text-base font-bold text-brand-800 leading-none">
                            {entry.progressPct.toFixed(1)}%
                          </p>
                          <div className="mt-1.5 inline-flex flex-wrap justify-end gap-0.5">
                            {entry.transformersInstalled > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                                I:{entry.transformersInstalled}
                              </span>
                            )}
                            {entry.transformersTerminated > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                                T:{entry.transformersTerminated}
                              </span>
                            )}
                            {entry.transformersTested > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">
                                Te:{entry.transformersTested}
                              </span>
                            )}
                            {entry.transformersCommissioned > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">
                                C:{entry.transformersCommissioned}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-right">
                          <StatusBadge status="submitted" />
                        </td>
                        <td className="py-4 text-right">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-500">
                            <Eye className="w-4 h-4" />
                            Hub Review
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {pendingEntries.length > 6 && (
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Showing first 6 of {pendingEntries.length} pending entries
              </p>
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
}
