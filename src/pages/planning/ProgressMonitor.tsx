import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Network,
  Send,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useProgressStore } from "@/store/progressStore";
import { useMasterDataStore } from "@/store/masterDataStore";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import type { EntryStatus } from "@/types";

const navItems = [
  { label: "Dashboard", path: "/hub-manager", icon: <LayoutDashboard className="w-4 h-4" /> },
//   { label: "Projects", path: "/hub-manager/projects", icon: <FolderKanban className="w-4 h-4" /> },
  { label: "Network Assets", path: "/hub-manager/assets", icon: <Network className="w-4 h-4" /> },
  { label: "Progress Monitor", path: "/hub-manager/monitor", icon: <TrendingUp className="w-4 h-4" /> },
];

const filters: Array<{ label: string; value: "all" | EntryStatus }> = [
  { label: "All entries", value: "all" },
  { label: "Awaiting review", value: "submitted" },
  { label: "Approved", value: "approved" },
  { label: "Published", value: "published" },
  { label: "Rejected", value: "rejected" },
];

export default function ProgressMonitor() {
  const { entries, fetchEntries, loading } = useProgressStore();
  const { getLocationName, getLineName } = useMasterDataStore();
  const [filter, setFilter] = useState<"all" | EntryStatus>("all");

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const stats = useMemo(() => {
    const averageProgress = entries.length > 0
      ? Math.round(entries.reduce((sum, entry) => sum + entry.progressPct, 0) / entries.length)
      : 0;

    return {
      total: entries.length,
      submitted: entries.filter((entry) => entry.status === "submitted").length,
      approved: entries.filter((entry) => ["approved", "published"].includes(entry.status)).length,
      averageProgress,
      installed: entries.reduce((sum, entry) => sum + entry.transformersInstalled, 0),
      tested: entries.reduce((sum, entry) => sum + entry.transformersTested, 0),
      commissioned: entries.reduce((sum, entry) => sum + entry.transformersCommissioned, 0),
    };
  }, [entries]);

  const visibleEntries = useMemo(
    () => [...entries]
      .filter((entry) => filter === "all" || entry.status === filter)
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()),
    [entries, filter]
  );

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar role="hub_manager" navItems={navItems} title="Hub Manager Portal" />

      <main className="container py-5 space-y-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[10px] font-semibold text-violet-700 uppercase tracking-wider">Progress Tracking</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Progress Monitor</h1>
          <p className="text-slate-500 text-xs">Review field submissions and track network construction progress</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Progress Entries" value={stats.total} subtitle={`${stats.submitted} awaiting review`} icon={<BarChart3 className="w-5 h-5" />} iconBg="bg-violet-50" iconColor="text-violet-700" delay={0} />
          <StatCard title="Average Progress" value={`${stats.averageProgress}%`} subtitle="Across all field entries" icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-700" delay={0.05} />
          <StatCard title="Verified Entries" value={stats.approved} subtitle="Approved or published" icon={<CheckCircle2 className="w-5 h-5" />} iconBg="bg-blue-50" iconColor="text-blue-700" delay={0.1} />
          <StatCard title="Commissioned" value={stats.commissioned} subtitle={`${stats.tested} transformers tested`} icon={<Zap className="w-5 h-5" />} iconBg="bg-amber-50" iconColor="text-amber-700" delay={0.15} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 card p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5"><Activity className="w-4 h-4 text-violet-700" /> Field Progress Entries</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Latest updates from site engineers</p>
              </div>
              <select value={filter} onChange={(event) => setFilter(event.target.value as "all" | EntryStatus)} className="input-field w-auto text-xs py-2" aria-label="Filter progress entries">
                {filters.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>

            {loading && entries.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500"><Clock className="w-7 h-7 mx-auto mb-2 text-slate-300 animate-pulse" /> Loading progress entries...</div>
            ) : visibleEntries.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500"><Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" /> No entries match this filter.</div>
            ) : (
              <div className="space-y-2">
                {visibleEntries.map((entry, index) => (
                  <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}>
                    <Link to={`/hub-manager/review/${entry.id}`} className="block rounded-xl border border-slate-200/60 p-3 hover:border-violet-200/80 hover:bg-violet-50/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1"><span className="font-mono text-[10px] font-bold text-violet-700">#{entry.id.slice(-8).toUpperCase()}</span><StatusBadge status={entry.status} /></div>
                          <p className="text-sm font-bold text-slate-900 truncate">{entry.siteEngineerName || "Unknown Site Engineer"}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{getLocationName(entry.locationId)} · {getLineName(entry.lineId)} · {new Date(entry.entryDate).toLocaleDateString("en-GB")}</p>
                        </div>
                        <div className="text-right shrink-0"><p className="font-display text-lg font-bold text-violet-700">{entry.progressPct.toFixed(1)}%</p><p className="text-[9px] text-slate-500">{entry.transformersCommissioned} commissioned</p></div>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-3"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500" style={{ width: `${Math.min(entry.progressPct, 100)}%` }} /></div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-4 space-y-3">
            <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">Transformer Pipeline</h2>
            <div className="space-y-2">
              {[["Installed", stats.installed, "bg-slate-100 text-slate-700"], ["Tested", stats.tested, "bg-amber-100 text-amber-700"], ["Commissioned", stats.commissioned, "bg-emerald-100 text-emerald-700"]].map(([label, value, color]) => (
                <div key={label} className={`rounded-xl p-3 ${color}`}><p className="text-[10px] font-semibold uppercase tracking-wider">{label}</p><p className="font-display text-2xl font-bold">{value}</p></div>
              ))}
            </div>
            <Link to="/hub-manager" className="flex items-center justify-center gap-2 rounded-xl border border-violet-200 p-3 text-xs font-semibold text-violet-700 hover:bg-violet-50 transition-colors"><Send className="w-4 h-4" /> View dashboard summary</Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}