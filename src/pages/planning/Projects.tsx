import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  Network,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  X,
  ArrowRight,
  Search,
  Wallet,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useManagementStore } from "@/store/managementStore";
import { useAuthStore } from "@/store/authStore";
import { Navbar } from "@/components/Navbar";
import { projectStatusLabels } from "@/types";
import type { Project, ProjectStatus, ProjectFormData } from "@/types";

const hubNavItems = [
  { label: "Dashboard", path: "/hub-manager", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Projects", path: "/hub-manager/projects", icon: <FolderKanban className="w-4 h-4" /> },
  { label: "Network Assets", path: "/hub-manager/assets", icon: <Network className="w-4 h-4" /> },
  { label: "Progress Monitor", path: "/hub-manager/monitor", icon: <TrendingUp className="w-4 h-4" /> },
];

const seniorNavItems = [
  { label: "Executive Dashboard", path: "/senior-manager", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Projects & Scopes", path: "/senior-manager/projects", icon: <FolderKanban className="w-4 h-4" /> },
  { label: "Published Records", path: "/senior-manager/records", icon: <TrendingUp className="w-4 h-4" /> },
];

const statusColors: Record<ProjectStatus, string> = {
  planning: "bg-slate-100 text-slate-700",
  active: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-rose-100 text-rose-700",
};

const normalizeDateValue = (value?: string): string => {
  if (!value) return "";
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";

  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().split("T")[0];
};

const emptyForm: ProjectFormData = {
  code: "",
  name: "",
  description: "",
  status: "planning",
  startDate: "",
  endDate: "",
  totalBudget: 0,
};

export default function Projects() {
  const { user } = useAuthStore();
  const location = useLocation();
  const isSeniorManager = user?.role === "senior_manager";
  const navItems = isSeniorManager ? seniorNavItems : hubNavItems;
  const portalRole = isSeniorManager ? "senior_manager" : "hub_manager";
  const projectListRoute = isSeniorManager ? "/senior-manager/projects" : "/hub-manager/projects";
  const detailRoute = (projectId: string) =>
    isSeniorManager ? `/senior-manager/projects/${projectId}` : `/hub-manager/projects/${projectId}`;
  const { projects, fetchProjects, createProject, updateProject, deleteProject, loading } = useManagementStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormData>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filtered = projects.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const handleOpenEdit = (project: Project) => {
    setForm({
      code: project.code,
      name: project.name,
      description: project.description || "",
      status: project.status,
      startDate: normalizeDateValue(project.startDate),
      endDate: normalizeDateValue(project.endDate),
      totalBudget: project.totalBudget,
    });
    setEditingId(project.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      startDate: normalizeDateValue(form.startDate),
      endDate: normalizeDateValue(form.endDate),
    };
    if (editingId) {
      await updateProject(editingId, payload);
    } else {
      await createProject(payload);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProject(deleteId);
      setDeleteId(null);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "RWF",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar role={portalRole} navItems={navItems} title={isSeniorManager ? "Senior Manager Portal" : "Hub Manager Portal"} />

      <main className="container py-5 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
        >
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold text-violet-700 uppercase tracking-wider">
              Project Management
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Projects
            </h1>
            <p className="text-slate-500 text-xs">
              {projects.length} project{projects.length !== 1 ? "s" : ""} total
            </p>
          </div>

          <button onClick={handleOpenCreate} className="btn-primary">
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 py-2 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-2 text-sm sm:w-48"
          >
            <option value="">All Statuses</option>
            {(Object.keys(projectStatusLabels) as ProjectStatus[]).map((s) => (
              <option key={s} value={s}>
                {projectStatusLabels[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                    Code
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                    Project Name
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                    Status
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                    Budget
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                    Scopes
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                    Tasks
                  </th>
                  <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-slate-500">
                      <FolderKanban className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      {projects.length === 0
                        ? "No projects yet. Click 'New Project' to create one."
                        : "No projects match your filters."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((project, i) => (
                    <motion.tr
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="group hover:bg-violet-50/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">
                          {project.code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={detailRoute(project.id)}
                          className="text-sm font-semibold text-slate-900 hover:text-violet-700"
                        >
                          {project.name}
                        </Link>
                        {project.description && (
                          <p className="text-[10px] text-slate-500 truncate max-w-[200px]">
                            {project.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`status-pill ${statusColors[project.status]}`}>
                          {projectStatusLabels[project.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-display text-xs font-bold text-slate-900">
                          {formatCurrency(project.totalBudget)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {project.scopeCount || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {project.taskSummary?.totalTasks || 0}
                        </span>
                        {project.taskSummary && project.taskSummary.totalTasks > 0 && (
                          <span className="text-[10px] text-emerald-600 ml-1">
                            ({project.taskSummary.completedTasks} done)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            to={detailRoute(project.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-700 hover:bg-violet-50 transition-colors"
                            title="View Details"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(project)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(project.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  {editingId ? "Edit Project" : "New Project"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Code *</label>
                    <input
                      type="text"
                      required
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      className="input-field"
                      placeholder="e.g. VDP-2024-01"
                    />
                  </div>
                  <div>
                    <label className="input-label">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
                      className="input-field"
                    >
                      {(Object.keys(projectStatusLabels) as ProjectStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {projectStatusLabels[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="input-label">Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                    placeholder="Project name"
                  />
                </div>

                <div>
                  <label className="input-label">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-field min-h-[60px] resize-none"
                    placeholder="Project description (optional)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Start Date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="input-label">End Date</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Total Budget (RWF)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.totalBudget}
                    onChange={(e) => setForm({ ...form, totalBudget: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingId ? "Update Project" : "Create Project"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Delete Project?
                  </h3>
                  <p className="text-xs text-slate-500">
                    This will also delete all scopes, tasks, and budgets.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setDeleteId(null)} className="btn-ghost">
                  Cancel
                </button>
                <button onClick={handleDelete} className="btn-danger">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}