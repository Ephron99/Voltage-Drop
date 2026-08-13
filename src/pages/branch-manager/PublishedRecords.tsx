import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
  Search,
  ArrowUpDown,
  Eye,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  X,
  Zap,
  MapPin,
  CalendarDays,
  Filter,
  Download,
  User as UserIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { ProgressEntry } from "@/types";
import { useProgressStore } from "@/store/progressStore";
import { useMasterDataStore } from "@/store/masterDataStore";
import { Navbar } from "@/components/Navbar";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressEntryDetail } from "@/components/ProgressEntryDetail";

const navItems = [
  {
    label: "Dashboard",
    path: "/branch-manager",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: "Published",
    path: "/branch-manager/published",
    icon: <BookOpen className="w-4 h-4" />,
  },
];

type SortField = "entryDate" | "publishedAt" | "locationId" | "progressPct";
type SortDir = "asc" | "desc";

export default function PublishedRecords() {
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

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<SortField>("publishedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [viewingEntry, setViewingEntry] = useState<ProgressEntry | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const filteredEntries = useMemo(() => {
    let result = [...allEntries];

    if (locationFilter !== "all") {
      result = result.filter((e) => e.locationId === locationFilter);
    }

    if (dateFrom) {
      result = result.filter((e) => e.entryDate >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((e) => e.entryDate <= dateTo);
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (e) =>
          getLocationName(e.locationId).toLowerCase().includes(s) ||
          getLineName(e.lineId).toLowerCase().includes(s) ||
          getTransformerName(e.transformerId).toLowerCase().includes(s) ||
          (e.siteEngineerName?.toLowerCase().includes(s) ?? false)
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "entryDate":
          cmp = new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
          break;
        case "publishedAt":
          cmp =
            new Date(a.publishedAt || 0).getTime() -
            new Date(b.publishedAt || 0).getTime();
          break;
        case "locationId":
          cmp = getLocationName(a.locationId).localeCompare(
            getLocationName(b.locationId)
          );
          break;
        case "progressPct":
          cmp = a.progressPct - b.progressPct;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [
    allEntries,
    locationFilter,
    dateFrom,
    dateTo,
    search,
    sortField,
    sortDir,
    getLocationName,
    getLineName,
    getTransformerName,
  ]);

  const avgProgress = useMemo(
    () =>
      filteredEntries.length > 0
        ? filteredEntries.reduce((sum, e) => sum + e.progressPct, 0) /
          filteredEntries.length
        : 0,
    [filteredEntries]
  );
  const totalCommissioned = useMemo(
    () =>
      filteredEntries.reduce((sum, e) => sum + e.transformersCommissioned, 0),
    [filteredEntries]
  );

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const hasFilters =
    locationFilter !== "all" || dateFrom !== "" || dateTo !== "" || search !== "";

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar
        role="branch_manager"
        navItems={navItems}
        title="Hub Manager Portal"
      />

      <main className="container py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
              Published Records
            </h1>
            <p className="text-slate-500 text-sm">
              All verified and published progress entries — data flows to dashboards from here
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="card p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Published Entries
              </p>
              <BookOpen className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="font-display text-3xl font-bold text-emerald-800 tracking-tight">
              {filteredEntries.length}
            </p>
            {hasFilters && allEntries.length > 0 && (
              <p className="text-xs text-slate-500 mt-0.5">
                of {allEntries.length} total — filters applied
              </p>
            )}
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Average Progress
              </p>
              <Zap className="w-4 h-4 text-brand-600 fill-current" />
            </div>
            <p className="font-display text-3xl font-bold text-brand-900 tracking-tight">
              {avgProgress.toFixed(1)}
              <span className="ml-1 text-sm font-semibold text-brand-700">%</span>
            </p>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                TRSFOs Commissioned
              </p>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="font-display text-3xl font-bold text-emerald-800 tracking-tight">
              {totalCommissioned}
              <span className="ml-1 text-sm font-semibold text-emerald-700">units</span>
            </p>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Unique Locations
              </p>
              <MapPin className="w-4 h-4 text-amber-600" />
            </div>
            <p className="font-display text-3xl font-bold text-amber-800 tracking-tight">
              {new Set(filteredEntries.map((e) => e.locationId)).size}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5 space-y-5"
        >
          <div className="flex flex-col xl:flex-row gap-3 xl:items-end xl:justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full xl:max-w-none xl:flex-1 xl:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search records..."
                  className="input-field pl-11 text-sm"
                />
              </div>
              <div>
                <label className="input-label !text-[11px] !mb-1 flex items-center gap-1.5">
                  <Filter className="w-3 h-3" />
                  Location Filter
                </label>
                <select
                  className="input-field !py-2.5 text-sm"
                  value={locationFilter}
                  onChange={(e) => {
                    setLocationFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All Locations</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label !text-[11px] !mb-1 flex items-center gap-1.5">
                  <CalendarDays className="w-3 h-3" />
                  From Date
                </label>
                <input
                  type="date"
                  className="input-field !py-2.5 text-sm"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div>
                <label className="input-label !text-[11px] !mb-1 flex items-center gap-1.5">
                  <CalendarDays className="w-3 h-3" />
                  To Date
                </label>
                <input
                  type="date"
                  className="input-field !py-2.5 text-sm"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {hasFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setLocationFilter("all");
                  setDateFrom("");
                  setDateTo("");
                  setPage(1);
                }}
                className="btn-ghost text-rose-600 hover:bg-rose-50 hover:text-rose-700 xl:justify-start"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>

          <div className="overflow-x-auto -mx-5 px-5 scrollbar-thin">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left pr-4 pb-3">
                    <button
                      onClick={() => toggleSort("publishedAt")}
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Published
                      <ArrowUpDown
                        className={`w-3 h-3 transition-transform ${
                          sortField === "publishedAt" && sortDir === "asc"
                            ? "rotate-180"
                            : ""
                        } ${sortField === "publishedAt" ? "text-brand-700" : ""}`}
                      />
                    </button>
                  </th>
                  <th className="text-left pr-4 pb-3">
                    <button
                      onClick={() => toggleSort("entryDate")}
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Entry Date
                      <ArrowUpDown
                        className={`w-3 h-3 transition-transform ${
                          sortField === "entryDate" && sortDir === "asc"
                            ? "rotate-180"
                            : ""
                        } ${sortField === "entryDate" ? "text-brand-700" : ""}`}
                      />
                    </button>
                  </th>
                  <th className="text-left pr-4 pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Branch Manager
                  </th>
                  <th className="text-left pr-4 pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Location / Line / TRSFO
                  </th>
                  <th className="text-right pr-4 pb-3">
                    <button
                      onClick={() => toggleSort("progressPct")}
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 ml-auto transition-colors"
                    >
                      Progress
                      <ArrowUpDown
                        className={`w-3 h-3 transition-transform ${
                          sortField === "progressPct" && sortDir === "asc"
                            ? "rotate-180"
                            : ""
                        } ${sortField === "progressPct" ? "text-brand-700" : ""}`}
                      />
                    </button>
                  </th>
                  <th className="text-left pr-4 pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="text-right pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence mode="wait">
                  {filteredEntries.length === 0 ? (
                    <tr key="empty">
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2.5 max-w-sm mx-auto">
                          <FileQuestion className="w-12 h-12 text-slate-300" />
                          <p className="text-sm font-semibold text-slate-500">
                            No published records match your filters
                          </p>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Try clearing filters or search for different criteria
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedEntries.map((entry, i) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-emerald-50/40 transition-colors"
                      >
                        <td className="py-4 pr-4">
                          <p className="text-sm font-bold text-slate-800 leading-tight">
                            {entry.publishedAt
                              ? new Date(entry.publishedAt).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "2-digit",
                                  }
                                )
                              : "N/A"}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {entry.publishedAt
                              ? new Date(entry.publishedAt).toLocaleTimeString(
                                  "en-GB",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : ""}
                          </p>
                        </td>
                        <td className="py-4 pr-4">
                          <p className="text-sm font-semibold text-slate-800 leading-tight">
                            {new Date(entry.entryDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                            #{entry.id.slice(-6).toUpperCase()}
                          </p>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 border border-brand-200/50 shrink-0">
                              <UserIcon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 leading-tight">
                                {entry.siteEngineerName ?? "—"}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Branch Manager
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4 align-top">
                          <p className="text-sm font-semibold text-slate-800 leading-tight">
                            📍 {getLocationName(entry.locationId)}
                          </p>
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9px] font-bold">
                              {entry.voltageLevel}
                            </span>
                            <span className="text-xs text-slate-500">
                              {getLineName(entry.lineId)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            ⚡ {getTransformerName(entry.transformerId)}
                          </p>
                        </td>
                        <td className="py-4 pr-4 text-right">
                          <p className="font-display text-lg font-bold text-brand-800 leading-none">
                            {entry.progressPct.toFixed(1)}%
                          </p>
                          <div className="mt-1.5 inline-flex flex-wrap justify-end gap-0.5">
                            {entry.transformersCommissioned > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">
                                C:{entry.transformersCommissioned}
                              </span>
                            )}
                            {entry.transformersTested > 0 &&
                              entry.transformersTested >
                                entry.transformersCommissioned && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">
                                  Te:
                                  {entry.transformersTested -
                                    entry.transformersCommissioned}
                                </span>
                              )}
                            {entry.transformersTerminated > 0 &&
                              entry.transformersTerminated >
                                entry.transformersTested && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                                  T:
                                  {entry.transformersTerminated -
                                    entry.transformersTested}
                                </span>
                              )}
                            {entry.transformersInstalled > 0 &&
                              entry.transformersInstalled >
                                entry.transformersTerminated && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                                  I:
                                  {entry.transformersInstalled -
                                    entry.transformersTerminated}
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <StatusBadge status="published" />
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => setViewingEntry(entry)}
                            className="p-2 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="View full details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {filteredEntries.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Page <b className="text-slate-700">{currentPage}</b> of{" "}
                <b className="text-slate-700">{totalPages}</b>
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pg;
                  if (totalPages <= 5) {
                    pg = i + 1;
                  } else if (currentPage <= 3) {
                    pg = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pg = totalPages - 4 + i;
                  } else {
                    pg = currentPage - 2 + i;
                  }
                  const isActive = pg === currentPage;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-emerald-700 text-white shadow-md"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <AnimatePresence>
        {viewingEntry && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingEntry(null)}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-0 bottom-0 lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-50 w-full lg:max-w-3xl bg-white border border-slate-200 lg:shadow-2xl rounded-t-3xl lg:rounded-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <div className="sticky top-0 z-10 bg-white border-b border-slate-200/60 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    Published Record Details
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verified and published progress entry
                  </p>
                </div>
                <button
                  onClick={() => setViewingEntry(null)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <ProgressEntryDetail entry={viewingEntry} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
