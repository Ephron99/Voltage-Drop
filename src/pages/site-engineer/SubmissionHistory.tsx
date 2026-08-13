import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  LayoutDashboard,
  FileEdit,
  Search,
  ArrowUpDown,
  Eye,
  Edit3,
  Trash2,
  Send,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { EntryStatus, ProgressEntry } from "@/types";
import { statusLabels } from "@/types";
import { useAuthStore } from "@/store/authStore";
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
    label: "New Entry",
    path: "/branch-manager/entry",
    icon: <FileEdit className="w-4 h-4" />,
  },
  {
    label: "My History",
    path: "/branch-manager/history",
    icon: <History className="w-4 h-4" />,
  },
];

const statusFilters: (EntryStatus | "all")[] = [
  "all",
  "draft",
  "submitted",
  "approved",
  "published",
  "rejected",
];

type SortField = "entryDate" | "status" | "progressPct";
type SortDir = "asc" | "desc";

export default function SubmissionHistory() {
  const { user } = useAuthStore();
  const engineerId = user?.id ?? "";
  const rawEntries = useProgressStore((s) => s.entries);
  const { getLocationName, getLineName, getTransformerName } =
    useMasterDataStore();
  const { submitEntry, deleteEntry, fetchEntries } = useProgressStore();
  const { fetchAll, initialized: masterInitialized } = useMasterDataStore();

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    if (!masterInitialized) {
      fetchAll();
    }
  }, [fetchAll, masterInitialized]);

  const allEntries = useMemo(
    () =>
      rawEntries
        .filter((e) => e.siteEngineerId === engineerId)
        .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()),
    [rawEntries, engineerId]
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("all");
  const [sortField, setSortField] = useState<SortField>("entryDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [viewingEntry, setViewingEntry] = useState<ProgressEntry | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const filteredEntries = useMemo(() => {
    let result = [...allEntries];

    if (statusFilter !== "all") {
      result = result.filter((e) => e.status === statusFilter);
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (e) =>
          getLocationName(e.locationId).toLowerCase().includes(s) ||
          getLineName(e.lineId).toLowerCase().includes(s) ||
          getTransformerName(e.transformerId).toLowerCase().includes(s)
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "entryDate":
          cmp = new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
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
    statusFilter,
    search,
    sortField,
    sortDir,
    getLocationName,
    getLineName,
    getTransformerName,
  ]);

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

  const handleQuickSubmit = async (entry: ProgressEntry) => {
    if (
      confirm(
        `Submit entry dated ${entry.entryDate} for review by Hub Manager?`
      )
    ) {
      await submitEntry(entry.id);
    }
  };

  const handleDelete = async (entry: ProgressEntry) => {
    if (confirm(`Delete this ${entry.status} entry? This cannot be undone.`)) {
      await deleteEntry(entry.id);
    }
  };

  const countsByStatus = useMemo(() => {
    const counts: Record<EntryStatus | "all", number> = {
      all: allEntries.length,
      draft: 0,
      submitted: 0,
      approved: 0,
      published: 0,
      rejected: 0,
    };
    allEntries.forEach((e) => {
      counts[e.status]++;
    });
    return counts;
  }, [allEntries]);

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar
        role="branch_manager"
        navItems={navItems}
        title="Branch Manager Portal"
      />

      <main className="container py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
              Submission History
            </h1>
            <p className="text-slate-500 text-sm">
              Track status of all your progress entries, from draft to published
            </p>
          </div>
          <Link to="/branch-manager/entry" className="btn-primary">
            <FileEdit className="w-4.5 h-4.5" />
            New Progress Entry
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5"
        >
          {statusFilters.map((status, i) => {
            const isActive = statusFilter === status;
            const count = countsByStatus[status];
            return (
              <motion.button
                key={status}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.03 }}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`relative p-3 rounded-xl text-left transition-all ${
                  isActive
                    ? "bg-white border-brand-500 shadow-card-hover"
                    : "bg-white/60 border-slate-200 hover:bg-white hover:shadow-card"
                } border`}
              >
                <p
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    isActive ? "text-brand-700" : "text-slate-500"
                  }`}
                >
                  {status === "all" ? "All Entries" : statusLabels[status]}
                </p>
                <p
                  className={`mt-1 font-display text-2xl font-bold ${
                    isActive ? "text-brand-900" : "text-slate-800"
                  }`}
                >
                  {count}
                </p>
                {isActive && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-500" />
                )}
              </motion.button>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card p-5 space-y-5"
        >
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by location, line, or transformer..."
                className="input-field pl-11"
              />
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-brand-600" />
              <span>
                Showing <b className="text-slate-800">{filteredEntries.length}</b> of{" "}
                <b className="text-slate-800">{allEntries.length}</b> total entries
              </span>
            </div>
          </div>

          <div className="overflow-x-auto -mx-5 px-5 scrollbar-thin">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left pr-4 pb-3">
                    <button
                      onClick={() => toggleSort("entryDate")}
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Date
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
                    Location Details
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
                  <th className="text-left pr-4 pb-3">
                    <button
                      onClick={() => toggleSort("status")}
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Status
                      <ArrowUpDown
                        className={`w-3 h-3 transition-transform ${
                          sortField === "status" && sortDir === "asc"
                            ? "rotate-180"
                            : ""
                        } ${sortField === "status" ? "text-brand-700" : ""}`}
                      />
                    </button>
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
                      <td colSpan={5} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2.5 max-w-sm mx-auto">
                          <FileQuestion className="w-12 h-12 text-slate-300" />
                          <p className="text-sm font-semibold text-slate-500">
                            No entries found
                          </p>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {search || statusFilter !== "all"
                              ? "Try adjusting your search or filter criteria"
                              : "Create your first progress entry to get started tracking progress"}
                          </p>
                          {!search && statusFilter === "all" && (
                            <Link
                              to="/branch-manager/entry"
                              className="mt-2 btn-primary text-sm py-2 px-4"
                            >
                              <FileEdit className="w-4 h-4" />
                              Create Entry
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedEntries.map((entry, i) => {
                      const canEdit = ["draft", "rejected"].includes(entry.status);
                      const canDelete = ["draft", "rejected"].includes(entry.status);
                      const canSubmit = ["draft", "rejected"].includes(entry.status);
                      return (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-slate-50/60 transition-colors group"
                        >
                          <td className="py-4 pr-4 align-top">
                            <p className="text-sm font-bold text-slate-800 leading-tight">
                              {new Date(entry.entryDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              #{entry.id.slice(-6).toUpperCase()}
                            </p>
                            {entry.rejectionComments && entry.status === "rejected" && (
                              <div className="mt-2 flex items-start gap-1.5 text-[11px] text-rose-700 bg-rose-50 border border-rose-200/60 rounded-lg px-2 py-1.5 max-w-xs">
                                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                <span className="line-clamp-2 leading-snug">
                                  {entry.rejectionComments}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 pr-4 align-top">
                            <p className="text-sm font-semibold text-slate-800 leading-tight">
                              {getLocationName(entry.locationId)}
                            </p>
                            <div className="flex flex-wrap items-center gap-1 mt-1.5">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-700 font-mono text-[9px] font-bold">
                                {entry.voltageLevel}
                              </span>
                              <span className="text-xs text-slate-500">
                                {getLineName(entry.lineId)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              TRSFO: {getTransformerName(entry.transformerId)}
                            </p>
                          </td>
                          <td className="py-4 pr-4 text-right align-top">
                            <p className="font-display text-lg font-bold text-brand-800 leading-none">
                              {entry.progressPct.toFixed(1)}%
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">progress</p>
                            <div className="mt-2 inline-flex flex-wrap justify-end gap-0.5">
                              {["I", "T", "Te", "C"].map((abbr, idx) => {
                                const val =
                                  [
                                    entry.transformersInstalled,
                                    entry.transformersTerminated,
                                    entry.transformersTested,
                                    entry.transformersCommissioned,
                                  ][idx];
                                if (val === 0) return null;
                                const colors = [
                                  "bg-slate-100 text-slate-700",
                                  "bg-blue-100 text-blue-700",
                                  "bg-amber-100 text-amber-700",
                                  "bg-emerald-100 text-emerald-700",
                                ][idx];
                                return (
                                  <span
                                    key={abbr}
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${colors}`}
                                  >
                                    {abbr}:{val}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-4 pr-4 align-top">
                            <StatusBadge status={entry.status} />
                          </td>
                          <td className="py-4 text-right align-top">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => setViewingEntry(entry)}
                                className="p-2 rounded-lg text-slate-500 hover:text-brand-800 hover:bg-brand-50 transition-colors"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <Link
                              to={`/branch-manager/entry/${entry.id}`}
                                className={`p-2 rounded-lg transition-colors ${
                                  canEdit
                                    ? "text-slate-500 hover:text-amber-700 hover:bg-amber-50"
                                    : "text-slate-300 cursor-not-allowed"
                                }`}
                                onClick={(e) => !canEdit && e.preventDefault()}
                                title={canEdit ? "Edit entry" : "Cannot edit"}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Link>
                              {canSubmit && (
                                <button
                                  onClick={() => handleQuickSubmit(entry)}
                                  className="p-2 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                  title="Submit for review"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(entry)}
                                className={`p-2 rounded-lg transition-colors ${
                                  canDelete
                                    ? "text-slate-500 hover:text-rose-700 hover:bg-rose-50"
                                    : "text-slate-300 cursor-not-allowed"
                                }`}
                                onClickCapture={(e) => !canDelete && e.preventDefault()}
                                title={canDelete ? "Delete entry" : "Cannot delete"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
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
                          ? "bg-brand-800 text-white shadow-md"
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
              className="fixed inset-x-0 bottom-0 lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-50 w-full lg:max-w-3xl lg:rounded-2xl bg-white border border-slate-200 lg:shadow-2xl rounded-t-3xl lg:rounded-2xl max-h-[90vh] lg:max-h-[85vh] overflow-y-auto scrollbar-thin"
            >
              <div className="sticky top-0 z-10 bg-white border-b border-slate-200/60 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    Entry Details
                  </h3>
                  <p className="text-xs text-slate-500">
                    Full progress information and status
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
                {["draft", "rejected"].includes(viewingEntry.status) && (
                  <div className="mt-6 pt-5 border-t border-slate-200/60 flex flex-col sm:flex-row gap-3 justify-end">
                    <Link
                      to={`/branch-manager/entry/${viewingEntry.id}`}
                      onClick={() => setViewingEntry(null)}
                      className="btn-secondary justify-center sm:justify-start"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit & Resubmit
                    </Link>
                    <button
                      onClick={async () => {
                        await submitEntry(viewingEntry.id);
                        setViewingEntry(null);
                      }}
                      className="btn-primary justify-center sm:justify-start"
                    >
                      <Send className="w-4 h-4" />
                      Submit Now
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
