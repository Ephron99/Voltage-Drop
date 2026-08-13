import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  LayoutDashboard,
  Search,
  ArrowUpDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Zap,
  MapPin,
  CalendarDays,
  Filter,
  Download,
  BarChart3,
  Users,
} from "lucide-react";
import type { ProgressEntry } from "@/types";
import { useProgressStore } from "@/store/progressStore";
import { useMasterDataStore } from "@/store/masterDataStore";
import { Navbar } from "@/components/Navbar";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressEntryDetail } from "@/components/ProgressEntryDetail";

const navItems = [
  {
    label: "Dashboard",
    path: "/senior-manager",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: "Published Records",
    path: "/senior-manager/records",
    icon: <BookOpen className="w-4 h-4" />,
  },
];

type SortField = "entryDate" | "publishedAt" | "locationId" | "progressPct";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 8;

export default function ManagementRecords() {
  const rawEntries = useProgressStore((s) => s.entries);
  const {
    locations,
    getLocationName,
    getLineName,
    getTransformerName,
  } = useMasterDataStore();

  const allEntries = useMemo(
    () =>
      [...rawEntries]
        .filter((e) => e.status === "published")
        .sort(
          (a, b) =>
            new Date(b.publishedAt || b.updatedAt).getTime() -
            new Date(a.publishedAt || a.updatedAt).getTime()
        ),
    [rawEntries]
  );

  const [sortField, setSortField] = useState<SortField>("publishedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<ProgressEntry | null>(null);

  const summaryStats = useMemo(() => {
    const avgProgress =
      allEntries.length > 0
        ? allEntries.reduce((sum, e) => sum + e.progressPct, 0) /
          allEntries.length
        : 0;
    const totalTRSFO = allEntries.reduce(
      (sum, e) => sum + e.transformersCommissioned,
      0
    );
    const uniqueEngineers = new Set(allEntries.map((e) => e.siteEngineerId)).size;
    return { avgProgress, totalTRSFO, uniqueEngineers };
  }, [allEntries]);

  const filtered = useMemo(() => {
    let list = [...allEntries];
    if (locationFilter !== "all") {
      list = list.filter((e) => e.locationId === locationFilter);
    }
    if (search.trim().length > 0) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          getLocationName(e.locationId).toLowerCase().includes(q) ||
          getLineName(e.lineId).toLowerCase().includes(q) ||
          getTransformerName(e.transformerId).toLowerCase().includes(q) ||
          (e.siteEngineerName || "").toLowerCase().includes(q) ||
          (e.branchManagerName || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      switch (sortField) {
        case "entryDate":
          av = new Date(a.entryDate).getTime();
          bv = new Date(b.entryDate).getTime();
          break;
        case "publishedAt":
          av = new Date(a.publishedAt || a.updatedAt).getTime();
          bv = new Date(b.publishedAt || b.updatedAt).getTime();
          break;
        case "locationId":
          av = getLocationName(a.locationId);
          bv = getLocationName(b.locationId);
          break;
        case "progressPct":
          av = a.progressPct;
          bv = b.progressPct;
          break;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [
    allEntries,
    locationFilter,
    search,
    sortField,
    sortDir,
    getLocationName,
    getLineName,
    getTransformerName,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleExport = () => {
    const rows = [
      [
        "Entry Date",
        "Published Date",
        "Location",
        "Line",
        "Voltage",
        "Transformer",
        "Progress %",
        "TRSFO Installed",
        "TRSFO Terminated",
        "TRSFO Tested",
        "TRSFO Commissioned",
        "Branch Manager",
        "Hub Manager",
      ],
      ...filtered.map((e) => [
        e.entryDate,
        e.publishedAt || e.updatedAt,
        getLocationName(e.locationId),
        getLineName(e.lineId),
        e.voltageLevel,
        getTransformerName(e.transformerId),
        e.progressPct.toString(),
        e.transformersInstalled.toString(),
        e.transformersTerminated.toString(),
        e.transformersTested.toString(),
        e.transformersCommissioned.toString(),
        e.siteEngineerName || "",
        e.branchManagerName || "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voltage-drop-published-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar role="senior_manager" navItems={navItems} title="Senior Manager Portal" />

      <main className="container py-5 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
        >
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
              Verified Data
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Published Records Archive
            </h1>
            <p className="text-slate-500 text-xs">
              {allEntries.length} record{allEntries.length !== 1 && "s"} approved
              and published by Hub Managers · Read-only executive view
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={filtered.length === 0}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="card p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 border border-brand-200/60 flex items-center justify-center shrink-0 shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Average Progress
              </p>
              <p className="font-display text-lg font-bold text-slate-900 leading-tight mt-0.5">
                {summaryStats.avgProgress.toFixed(1)}
                <span className="text-[10px] text-slate-500 ml-1 font-semibold">
                  %
                </span>
              </p>
            </div>
          </div>
          <div className="card p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0 shadow-inner">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Transformers Commissioned
              </p>
              <p className="font-display text-lg font-bold text-slate-900 leading-tight mt-0.5">
                {summaryStats.totalTRSFO}
                <span className="text-[10px] text-slate-500 ml-1 font-semibold">
                  units
                </span>
              </p>
            </div>
          </div>
          <div className="card p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0 shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Contributing Engineers
              </p>
              <p className="font-display text-lg font-bold text-slate-900 leading-tight mt-0.5">
                {summaryStats.uniqueEngineers}
                <span className="text-[10px] text-slate-500 ml-1 font-semibold">
                  active
                </span>
              </p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card p-4 space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-2.5 md:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search location, line, engineer..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 hover:border-slate-300"
                />
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={locationFilter}
                  onChange={(e) => {
                    setLocationFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none appearance-none"
                >
                  <option value="all">All locations</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 text-center sm:text-right">
              Showing <span className="font-semibold text-slate-700">{filtered.length}</span>{" "}
              of {allEntries.length} published records
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/60">
            <table className="w-full text-left min-w-[820px]">
              <thead className="bg-slate-50/60">
                <tr>
                  <th
                    className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5 cursor-pointer select-none hover:bg-slate-100/60 transition-colors"
                    onClick={() => toggleSort("entryDate")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Entry Date
                      <ArrowUpDown className={`w-3 h-3 transition-transform ${sortField === "entryDate" ? (sortDir === "asc" ? "rotate-180" : "") : "opacity-40"}`} />
                    </span>
                  </th>
                  <th
                    className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5 cursor-pointer select-none hover:bg-slate-100/60 transition-colors"
                    onClick={() => toggleSort("locationId")}
                  >
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Location / Line
                      <ArrowUpDown className={`w-3 h-3 transition-transform ${sortField === "locationId" ? (sortDir === "asc" ? "rotate-180" : "") : "opacity-40"}`} />
                    </span>
                  </th>
                  <th
                    className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5 cursor-pointer select-none hover:bg-slate-100/60 transition-colors"
                    onClick={() => toggleSort("progressPct")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Progress
                      <ArrowUpDown className={`w-3 h-3 transition-transform ${sortField === "progressPct" ? (sortDir === "asc" ? "rotate-180" : "") : "opacity-40"}`} />
                    </span>
                  </th>
                  <th
                    className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5"
                  >
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      Published
                    </span>
                  </th>
                  <th
                    className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5"
                  >
                    Approver
                  </th>
                  <th
                    className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5 w-[72px]"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <BookOpen className="w-8 h-8" />
                        <p className="text-xs font-semibold text-slate-500">
                          No published records match your filters
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Try clearing search or location filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                <AnimatePresence>
                  {paged.map((entry, i) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-3 py-3 align-top">
                        <p className="font-mono text-[10px] font-semibold text-slate-800 leading-tight">
                          {new Date(entry.entryDate).toLocaleDateString("en-GB")}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {entry.voltageLevel} · {getTransformerName(entry.transformerId)}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[200px]">
                          {getLocationName(entry.locationId)}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[200px]">
                          {getLineName(entry.lineId)}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="text-right space-y-1">
                          <div>
                            <span className="font-display text-sm font-bold text-brand-800">
                              {entry.progressPct.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-end gap-1 flex-wrap max-w-[160px]">
                            <span className="inline-flex items-center px-1 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[9px] font-bold">
                              I {entry.transformersInstalled}
                            </span>
                            <span className="inline-flex items-center px-1 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono text-[9px] font-bold">
                              T {entry.transformersTerminated}
                            </span>
                            <span className="inline-flex items-center px-1 py-0.5 rounded bg-violet-100 text-violet-700 font-mono text-[9px] font-bold">
                              Te {entry.transformersTested}
                            </span>
                            <span className="inline-flex items-center px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 font-mono text-[9px] font-bold">
                              C {entry.transformersCommissioned}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <StatusBadge status={entry.status} />
                        <p className="text-[9px] text-slate-400 mt-1 font-mono">
                          {entry.publishedAt
                            ? new Date(entry.publishedAt).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className="text-xs font-semibold text-slate-700 leading-tight">
                          {entry.branchManagerName || "—"}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {entry.siteEngineerName || "Engineer unassigned"}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <button
                          onClick={() => setSelectedEntry(entry)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold text-slate-700 hover:text-brand-800 hover:bg-brand-50 border border-slate-200 hover:border-brand-200 transition-colors"
                          title="View full details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-slate-500">
                Page <span className="font-semibold text-slate-700">{page}</span> of{" "}
                <span className="font-semibold text-slate-700">{totalPages}</span>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .slice(0, 5)
                    .map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-bold transition-colors ${
                          page === p
                            ? "bg-brand-800 text-white shadow-sm"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  {totalPages > 5 && (
                    <span className="text-[10px] text-slate-400 px-1">…</span>
                  )}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden"
            >
              <div className="card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 bg-slate-50/60">
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900 tracking-tight">
                      Published Record Details
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      REF: {selectedEntry.id.toUpperCase()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="overflow-y-auto scrollbar-thin flex-1">
                  <ProgressEntryDetail entry={selectedEntry} readOnly />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
