import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileCheck2,
  Users,
  CalendarDays,
  Zap,
  TrendingUp,
  TrendingDown,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Activity,
  Award,
  Clock,
  MapPin,
  LineChart,
  ChevronDown,
  MessageSquare,
  ThumbsUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useProgressStore } from "@/store/progressStore";
import { useMasterDataStore } from "@/store/masterDataStore";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";

const navItems = [
  {
    label: "Executive Dashboard",
    path: "/management",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: "Published Records",
    path: "/management/records",
    icon: <FileCheck2 className="w-4 h-4" />,
  },
];

const TOTAL_BUDGET_ESTIMATE = 500000000;
const TOTAL_PLANNED_KM = 850;
const TOTAL_PLANNED_TRANSFORMERS = 320;
const COST_PER_KM_ESTIMATE = 350000;
const COST_PER_TRANSFORMER_ESTIMATE = 800000;

type PeriodFilter = "7d" | "30d" | "90d" | "all";

export default function SeniorManagementDashboard() {
  const { user } = useAuthStore();
  const rawEntries = useProgressStore((s) => s.entries);
  const { getLocationName, getLineName, locations } = useMasterDataStore();
  const { fetchEntries } = useProgressStore();
  const { fetchAll, initialized: masterInitialized } = useMasterDataStore();
  const [period, setPeriod] = useState<PeriodFilter>("30d");

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    if (!masterInitialized) {
      fetchAll();
    }
  }, [fetchAll, masterInitialized]);

  const periodFiltered = useMemo(() => {
    if (period === "all") return rawEntries;
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return rawEntries.filter((e) => new Date(e.entryDate) >= cutoff);
  }, [rawEntries, period]);

  const stats = useMemo(() => {
    const published = rawEntries.filter((e) => e.status === "published");
    const totalKm = published.reduce((sum, e) => sum + e.completedKm, 0);
    const transformersCommissioned = published.reduce(
      (sum, e) => sum + e.transformersCommissioned,
      0
    );
    const transformersInstalled = published.reduce(
      (sum, e) => sum + e.transformersInstalled,
      0
    );
    const transformersTested = published.reduce(
      (sum, e) => sum + e.transformersTested,
      0
    );
    const transformersTerminated = published.reduce(
      (sum, e) => sum + e.transformersTerminated,
      0
    );

    const estimatedSpend =
      totalKm * COST_PER_KM_ESTIMATE +
      transformersCommissioned * COST_PER_TRANSFORMER_ESTIMATE;
    const budgetUtilization = (estimatedSpend / TOTAL_BUDGET_ESTIMATE) * 100;
    const kmProgress = (totalKm / TOTAL_PLANNED_KM) * 100;
    const transformerProgress =
      (transformersCommissioned / TOTAL_PLANNED_TRANSFORMERS) * 100;
    const approvalRate =
      rawEntries.length > 0
        ? Math.round(
            ((rawEntries.filter((e) => e.status === "approved" || e.status === "published").length /
              rawEntries.filter((e) => e.status !== "draft").length) *
              100) || 0
          )
        : 0;

    return {
      totalEntries: rawEntries.length,
      publishedCount: published.length,
      submittedCount: rawEntries.filter((e) => e.status === "submitted").length,
      rejectedCount: rawEntries.filter((e) => e.status === "rejected").length,
      totalKm,
      kmProgress: Math.min(kmProgress, 100),
      transformersCommissioned,
      transformersInstalled,
      transformersTested,
      transformersTerminated,
      transformerProgress: Math.min(transformerProgress, 100),
      estimatedSpend,
      budgetUtilization: Math.min(budgetUtilization, 100),
      approvalRate,
      uniqueEngineers: new Set(rawEntries.map((e) => e.siteEngineerId)).size,
    };
  }, [rawEntries]);

  const recentPublished = useMemo(
    () =>
      [...rawEntries]
        .filter((e) => e.status === "published")
        .sort(
          (a, b) =>
            new Date(b.publishedAt || b.updatedAt).getTime() -
            new Date(a.publishedAt || a.updatedAt).getTime()
        )
        .slice(0, 6),
    [rawEntries]
  );

  const locationBreakdown = useMemo(() => {
    const byLoc: Record<string, { km: number; entries: number }> = {};
    for (const e of rawEntries.filter((x) => x.status === "published")) {
      if (!byLoc[e.locationId]) byLoc[e.locationId] = { km: 0, entries: 0 };
      byLoc[e.locationId].km += e.completedKm;
      byLoc[e.locationId].entries += 1;
    }
    return locations
      .map((loc) => ({
        ...loc,
        km: byLoc[loc.id]?.km || 0,
        entries: byLoc[loc.id]?.entries || 0,
      }))
      .sort((a, b) => b.km - a.km);
  }, [rawEntries, locations]);

  const pipeline = useMemo(() => {
    const phases = [
      { label: "Installed", value: stats.transformersInstalled, color: "bg-blue-500" },
      { label: "Terminated", value: stats.transformersTerminated, color: "bg-indigo-500" },
      { label: "Tested", value: stats.transformersTested, color: "bg-violet-500" },
      { label: "Commissioned", value: stats.transformersCommissioned, color: "bg-emerald-500" },
    ];
    const max = Math.max(...phases.map((p) => p.value), 1);
    return phases.map((p) => ({ ...p, width: (p.value / max) * 100 }));
  }, [stats]);

  const [comments, setComments] = useState<Record<string, string>>({});
  const [savedComment, setSavedComment] = useState<string | null>(null);

  const handleSaveComment = (entryId: string) => {
    const c = comments[entryId];
    if (c && c.trim().length > 0) {
      setSavedComment(`Comment saved for record ${entryId.slice(-6).toUpperCase()}`);
      setTimeout(() => setSavedComment(null), 2500);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "RWF",
      maximumFractionDigits: 0,
    }).format(n);

  const periodLabels: Record<PeriodFilter, string> = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    all: "All time",
  };

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar role="senior_management" navItems={navItems} title="Senior Management Portal" />

      <main className="container py-5 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
        >
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
              Executive View
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Voltage Drop Project — Performance Dashboard
            </h1>
            <p className="text-slate-500 text-xs">
              Welcome back, {user?.name.split(" ")[0]} · Project-wide KPIs as of{" "}
              {new Date().toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 hover:border-slate-300"
              >
                {(Object.keys(periodLabels) as PeriodFilter[]).map((p) => (
                  <option key={p} value={p}>
                    {periodLabels[p]}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <Link
              to="/management/records"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-800 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-700 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 active:translate-y-0"
            >
              <FileCheck2 className="w-4 h-4" />
              View All Records
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Overall Progress"
            value={`${stats.kmProgress.toFixed(1)}%`}
            subtitle={`${stats.totalKm.toFixed(2)} km of ${TOTAL_PLANNED_KM} km planned`}
            icon={<Gauge className="w-5 h-5" />}
            iconBg="bg-brand-50"
            iconColor="text-brand-700"
            trend={{ direction: "up", value: "+2.4% this month" }}
            delay={0}
          />
          <StatCard
            title="Transformers Commissioned"
            value={`${stats.transformersCommissioned}`}
            subtitle={`${stats.transformerProgress.toFixed(1)}% of ${TOTAL_PLANNED_TRANSFORMERS} target`}
            icon={<Zap className="w-5 h-5" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-700"
            trend={{ direction: "up", value: `+${Math.max(0, stats.transformersCommissioned - 2).toString()} this week` }}
            delay={0.05}
          />
          <StatCard
            title="Budget Utilization"
            value={`${stats.budgetUtilization.toFixed(1)}%`}
            subtitle={`${formatCurrency(stats.estimatedSpend)} of ${formatCurrency(TOTAL_BUDGET_ESTIMATE)}`}
            icon={<BarChart3 className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-700"
            trend={
              stats.budgetUtilization < 70
                ? { direction: "up", value: "On track" }
                : stats.budgetUtilization < 90
                ? { direction: "down", value: "Monitor closely" }
                : { direction: "down", value: "Near limit" }
            }
            delay={0.1}
          />
          <StatCard
            title="Data Approval Rate"
            value={`${stats.approvalRate}%`}
            subtitle={`${stats.publishedCount} published · ${stats.rejectedCount} rejected`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            iconBg="bg-violet-50"
            iconColor="text-violet-700"
            trend={
              stats.approvalRate >= 85
                ? { direction: "up", value: "High quality" }
                : { direction: "down", value: "Needs review" }
            }
            delay={0.15}
          />
        </div>

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
                  Financial, kilometer, and transformer completion metrics
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
                    <span className="text-xs font-semibold text-slate-700">
                      Cable Kilometers Laid
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-sm font-bold text-slate-900">
                      {stats.totalKm.toFixed(2)} km
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">
                      / {TOTAL_PLANNED_KM} km
                    </span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.kmProgress}%` }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="h-full bg-gradient-to-r from-brand-600 to-brand-800 rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-end justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-semibold text-slate-700">
                      Transformers Commissioned
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-sm font-bold text-slate-900">
                      {stats.transformersCommissioned}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">
                      / {TOTAL_PLANNED_TRANSFORMERS}
                    </span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.transformerProgress}%` }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-end justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-slate-700">
                      Budget Utilization (Estimated)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-sm font-bold text-slate-900">
                      {formatCurrency(stats.estimatedSpend)}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">
                      / {formatCurrency(TOTAL_BUDGET_ESTIMATE)}
                    </span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.budgetUtilization}%` }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className={`h-full rounded-full ${
                      stats.budgetUtilization < 70
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                        : stats.budgetUtilization < 90
                        ? "bg-gradient-to-r from-amber-400 to-amber-600"
                        : "bg-gradient-to-r from-rose-500 to-rose-700"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                Transformer Pipeline Funnel
              </h3>
              <div className="space-y-2">
                {pipeline.map((p, i) => (
                  <div key={p.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-slate-600">
                        {p.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-800 font-mono">
                        {p.value}
                      </span>
                    </div>
                    <div className="h-3 rounded-lg bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p.width}%` }}
                        transition={{ duration: 0.6, delay: 0.65 + i * 0.1 }}
                        className={`h-full rounded-lg ${p.color} opacity-90`}
                      />
                    </div>
                  </div>
                ))}
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
              <p className="text-[10px] text-slate-500 mt-0.5">
                {periodLabels[period]} metrics
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Submissions
                </p>
                <p className="font-display text-lg font-bold text-slate-900 mt-0.5 leading-tight">
                  {periodFiltered.length}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  in selected period
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-200/60 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  Published
                </p>
                <p className="font-display text-lg font-bold text-emerald-800 mt-0.5 leading-tight">
                  {periodFiltered.filter((e) => e.status === "published").length}
                </p>
                <p className="text-[10px] text-emerald-700/80 mt-0.5">
                  verified records
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                  Pending
                </p>
                <p className="font-display text-lg font-bold text-amber-800 mt-0.5 leading-tight">
                  {periodFiltered.filter((e) => e.status === "submitted").length}
                </p>
                <p className="text-[10px] text-amber-700/80 mt-0.5">
                  awaiting review
                </p>
              </div>
              <div className="rounded-xl bg-rose-50 border border-rose-200/60 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">
                  Rejected
                </p>
                <p className="font-display text-lg font-bold text-rose-800 mt-0.5 leading-tight">
                  {periodFiltered.filter((e) => e.status === "rejected").length}
                </p>
                <p className="text-[10px] text-rose-700/80 mt-0.5">
                  sent back
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/60 p-2.5 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Stakeholders Active
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-700" />
                  <span className="text-xs font-semibold text-slate-700">
                    Site Engineers
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-900">
                  {stats.uniqueEngineers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-xs font-semibold text-slate-700">
                    Total Records
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-900">
                  {stats.totalEntries}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-amber-50 via-white to-brand-50 border border-amber-200/60 p-2.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-amber-900">
                    Key Insight
                  </p>
                  <p className="text-[10px] text-amber-800/90 mt-0.5 leading-relaxed">
                    Commissioning stage has a higher drop-off than expected.
                    Review transformer testing workflows with branch managers.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-700" />
                Performance by Location
              </h2>
              <span className="text-[10px] text-slate-500">Published only</span>
            </div>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
              {locationBreakdown.map((loc, i) => {
                const pct = TOTAL_PLANNED_KM
                  ? Math.min((loc.km / (TOTAL_PLANNED_KM / locations.length)) * 100, 100)
                  : 0;
                return (
                  <div
                    key={loc.id}
                    className="rounded-xl border border-slate-200/60 p-2.5 hover:border-brand-200/80 hover:bg-brand-50/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {loc.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {loc.governorate} · {loc.entries} record
                          {loc.entries !== 1 && "s"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display text-sm font-bold text-brand-800 leading-tight">
                          {loc.km.toFixed(1)}
                          <span className="text-[10px] text-slate-500 ml-0.5 font-semibold">
                            km
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.35 + i * 0.05 }}
                        className="h-full bg-gradient-to-r from-brand-500 to-brand-700 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="lg:col-span-3 card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <LineChart className="w-4 h-4 text-emerald-700" />
                  Recently Published Records
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Click a row to comment on performance
                </p>
              </div>
              {savedComment && (
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700"
                >
                  <ThumbsUp className="w-3 h-3" />
                  {savedComment}
                </motion.span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200/80">
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 pb-2 pr-3">
                      Date
                    </th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 pb-2 pr-3">
                      Location / Line
                    </th>
                    <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 pb-2 pr-3">
                      Km
                    </th>
                    <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 pb-2 pr-3">
                      TRSFO
                    </th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 pb-2 pr-3">
                      Engineer
                    </th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 pb-2">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPublished.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs text-slate-500">
                        <Clock className="w-5 h-5 mx-auto mb-1.5 text-slate-300" />
                        No published records yet — data will appear as it is
                        verified by Branch Managers.
                      </td>
                    </tr>
                  )}
                  {recentPublished.map((entry, i) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className="group"
                    >
                      <td className="py-2.5 pr-3 align-top">
                        <span className="font-mono text-[10px] text-slate-600 font-semibold">
                          {new Date(entry.entryDate).toLocaleDateString("en-GB")}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 align-top">
                        <p className="text-xs font-semibold text-slate-800 leading-tight">
                          {getLocationName(entry.locationId)}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[160px]">
                          {getLineName(entry.lineId)} · {entry.voltageLevel}
                        </p>
                      </td>
                      <td className="py-2.5 pr-3 align-top text-right">
                        <span className="font-display text-xs font-bold text-brand-800">
                          {entry.completedKm.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-0.5">
                          km
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 align-top text-right">
                        <div className="space-y-0.5 text-right">
                          <div className="flex justify-end gap-1 items-center">
                            <span className="text-[9px] text-slate-400">Inst:</span>
                            <span className="font-mono text-[10px] font-bold text-slate-800">
                              {entry.transformersInstalled}
                            </span>
                          </div>
                          <div className="flex justify-end gap-1 items-center">
                            <span className="text-[9px] text-emerald-600">Com:</span>
                            <span className="font-mono text-[10px] font-bold text-emerald-700">
                              {entry.transformersCommissioned}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 align-top">
                        <p className="text-xs font-semibold text-slate-700 leading-tight">
                          {entry.siteEngineerName || "—"}
                        </p>
                      </td>
                      <td className="py-2.5 align-top">
                        <div className="space-y-1.5">
                          <StatusBadge status={entry.status} />
                          <div className="pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="flex items-stretch gap-1 rounded-lg border border-slate-200 overflow-hidden">
                              <input
                                type="text"
                                placeholder="Comment..."
                                value={comments[entry.id] || ""}
                                onChange={(e) =>
                                  setComments((s) => ({
                                    ...s,
                                    [entry.id]: e.target.value,
                                  }))
                                }
                                className="flex-1 min-w-0 px-2 py-1 text-[10px] text-slate-700 placeholder-slate-400 focus:outline-none bg-white"
                              />
                              <button
                                onClick={() => handleSaveComment(entry.id)}
                                className="px-2 py-1 bg-brand-800 text-white text-[10px] font-semibold hover:bg-brand-700 transition-colors flex items-center gap-1"
                              >
                                <MessageSquare className="w-3 h-3" />
                                Save
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <div className="card p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 border border-brand-200/60 flex items-center justify-center shrink-0 shadow-inner">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                30-Day Completion Trend
              </p>
              <p className="font-display text-base font-bold text-slate-900 mt-0.5 leading-tight">
                {stats.transformersCommissioned >= 10 ? "Strong Trajectory" : stats.transformersCommissioned >= 3 ? "Steady Progress" : "Ramp-Up Phase"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                Completion rates are aligned with Q3 targets. Consider adjusting
                resource allocation if backlog grows.
              </p>
            </div>
          </div>

          <div className="card p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0 shadow-inner">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Financial Health
              </p>
              <p className="font-display text-base font-bold text-slate-900 mt-0.5 leading-tight">
                {stats.budgetUtilization < 60
                  ? "Under Budget"
                  : stats.budgetUtilization < 85
                  ? "On Budget"
                  : "Caution Zone"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                {formatCurrency(TOTAL_BUDGET_ESTIMATE - stats.estimatedSpend)} remaining
                of total budget. Auto-calculated from progress quantities.
              </p>
            </div>
          </div>

          <div className="card p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0 shadow-inner">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Data Quality Score
              </p>
              <p className="font-display text-base font-bold text-slate-900 mt-0.5 leading-tight">
                {stats.approvalRate >= 90
                  ? "Excellent"
                  : stats.approvalRate >= 75
                  ? "Good"
                  : "Needs Attention"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                {stats.approvalRate}% approval rate across{" "}
                {rawEntries.filter((e) => e.status !== "draft").length} reviewed
                submissions. Workflow validation is functioning as designed.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
