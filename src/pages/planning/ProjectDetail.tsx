import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Network,
  TrendingUp,
  ArrowLeft,
  Plus,
  X,
  Pencil,
  Trash2,
  CheckCircle2,
  Wallet,
  DollarSign,
  ListChecks,
  Target,
  GitBranch,
  Calendar,
  User,
  AlertTriangle,
} from "lucide-react";
import { useManagementStore } from "@/store/managementStore";
import { useMasterDataStore } from "@/store/masterDataStore";
import { useAuthStore } from "@/store/authStore";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import {
  projectStatusLabels,
  scopeStatusLabels,
  taskStatusLabels,
  taskPriorityLabels,
  budgetItemStatusLabels,
  fundTypeLabels,
} from "@/types";
import type {
  Project,
  Scope,
  Task,
  BudgetItem,
  FundTransaction,
  ScopeStatus,
  TaskStatus,
  TaskPriority,
  BudgetItemStatus,
  FundTransactionType,
  ScopeFormData,
  TaskFormData,
  BudgetItemFormData,
  FundTransactionFormData,
} from "@/types";

const navItems = [
  { label: "Dashboard", path: "/planning", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Projects", path: "/planning/projects", icon: <FolderKanban className="w-4 h-4" /> },
  { label: "Network Assets", path: "/planning/assets", icon: <Network className="w-4 h-4" /> },
  { label: "Progress Monitor", path: "/planning/monitor", icon: <TrendingUp className="w-4 h-4" /> },
];

type Tab = "scopes" | "tasks" | "budget" | "funds" | "monitor";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const {
    fetchProject,
    fetchScopes,
    fetchTasks,
    fetchBudgetItems,
    fetchFunds,
    fetchMonitorData,
    createScope,
    updateScope,
    approveScope,
    deleteScope,
    createTask,
    updateTask,
    deleteTask,
    createBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    createFund,
    deleteFund,
    getProjectById,
    getScopesByProject,
    getTasksByProject,
    getBudgetItemsByProject,
    getFundsByProject,
    monitorData,
  } = useManagementStore();
  const { locations, lines, transformers, fetchAll } = useMasterDataStore();
  const { users, loadUsers } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>("scopes");
  const [showScopeForm, setShowScopeForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showFundForm, setShowFundForm] = useState(false);
  const [editingScope, setEditingScope] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProject(id);
      fetchScopes(id);
      fetchTasks(id);
      fetchBudgetItems(id);
      fetchFunds(id);
    }
  }, [id, fetchProject, fetchScopes, fetchTasks, fetchBudgetItems, fetchFunds]);

  useEffect(() => {
    fetchAll();
    loadUsers("site_engineer");
  }, [fetchAll, loadUsers]);

  const project = id ? getProjectById(id) : undefined;
  const scopes = id ? getScopesByProject(id) : [];
  const tasks = id ? getTasksByProject(id) : [];
  const budgetItems = id ? getBudgetItemsByProject(id) : [];
  const funds = id ? getFundsByProject(id) : [];

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "RWF",
      maximumFractionDigits: 0,
    }).format(n);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "monitor" && id) {
      fetchMonitorData(id);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-electric-grid">
        <Navbar role="planning" navItems={navItems} title="Management Portal" />
        <div className="container py-20 text-center">
          <FolderKanban className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">Loading project or project not found...</p>
          <Link to="/planning/projects" className="btn-secondary mt-4">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const budgetSummary = project.budgetSummary || { totalPlanned: 0, totalSpent: 0, totalCommitted: 0 };
  const fundSummary = project.fundSummary || { totalAllocated: 0, totalDisbursed: 0, totalCommitted: 0, totalRefunded: 0 };
  const taskSummary = project.taskSummary || { totalTasks: 0, completedTasks: 0, inProgressTasks: 0, pendingTasks: 0, assignedTasks: 0, avgProgress: 0 };
  const fundAvailable = fundSummary.totalAllocated - fundSummary.totalDisbursed - fundSummary.totalCommitted;

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar role="planning" navItems={navItems} title="Management Portal" />

      <main className="container py-5 space-y-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/planning/projects" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-violet-700 mb-2">
            <ArrowLeft className="w-3 h-3" /> Back to Projects
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                  {project.code}
                </span>
                <span className={`status-pill ${
                  project.status === "active" ? "bg-emerald-100 text-emerald-700" :
                  project.status === "completed" ? "bg-blue-100 text-blue-700" :
                  project.status === "on_hold" ? "bg-amber-100 text-amber-700" :
                  project.status === "cancelled" ? "bg-rose-100 text-rose-700" :
                  "bg-slate-100 text-slate-700"
                }`}>
                  {projectStatusLabels[project.status]}
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-slate-500 text-xs max-w-2xl">{project.description}</p>
              )}
              <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                {project.startDate && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(project.startDate).toLocaleDateString("en-GB")}
                  </span>
                )}
                {project.endDate && (
                  <span>→ {new Date(project.endDate).toLocaleDateString("en-GB")}</span>
                )}
                <span className="inline-flex items-center gap-1">
                  <User className="w-3 h-3" /> {project.createdByName || "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Total Budget"
            value={formatCurrency(project.totalBudget)}
            subtitle={`${formatCurrency(budgetSummary.totalSpent)} spent`}
            icon={<Wallet className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-700"
            delay={0}
          />
          <StatCard
            title="Funds Available"
            value={formatCurrency(fundAvailable)}
            subtitle={`${formatCurrency(fundSummary.totalDisbursed)} disbursed`}
            icon={<DollarSign className="w-5 h-5" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-700"
            delay={0.05}
          />
          <StatCard
            title="Scopes"
            value={scopes.length}
            subtitle={`${scopes.filter((s) => s.status === "active").length} active`}
            icon={<Target className="w-5 h-5" />}
            iconBg="bg-violet-50"
            iconColor="text-violet-700"
            delay={0.1}
          />
          <StatCard
            title="Tasks"
            value={taskSummary.totalTasks}
            subtitle={`${taskSummary.completedTasks} completed · ${Math.round(taskSummary.avgProgress)}% avg`}
            icon={<ListChecks className="w-5 h-5" />}
            iconBg="bg-blue-50"
            iconColor="text-blue-700"
            delay={0.15}
          />
        </div>

        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
          {([
            { key: "scopes", label: "Scopes", icon: <Target className="w-3.5 h-3.5" /> },
            { key: "tasks", label: "Tasks", icon: <ListChecks className="w-3.5 h-3.5" /> },
            { key: "budget", label: "Budget", icon: <Wallet className="w-3.5 h-3.5" /> },
            { key: "funds", label: "Funds", icon: <DollarSign className="w-3.5 h-3.5" /> },
            { key: "monitor", label: "Monitor", icon: <TrendingUp className="w-3.5 h-3.5" /> },
          ] as { key: Tab; label: string; icon: React.ReactNode }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-violet-700 text-violet-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "scopes" && (
              <ScopesTab
                scopes={scopes}
                locations={locations}
                projectId={project.id}
                showForm={showScopeForm}
                setShowForm={setShowScopeForm}
                editingId={editingScope}
                setEditingId={setEditingScope}
                createScope={createScope}
                updateScope={updateScope}
                approveScope={approveScope}
                deleteScope={deleteScope}
              />
            )}
            {activeTab === "tasks" && (
              <TasksTab
                tasks={tasks}
                scopes={scopes}
                users={users.filter((u) => u.role === "site_engineer")}
                lines={lines}
                transformers={transformers}
                projectId={project.id}
                showForm={showTaskForm}
                setShowForm={setShowTaskForm}
                editingId={editingTask}
                setEditingId={setEditingTask}
                createTask={createTask}
                updateTask={updateTask}
                deleteTask={deleteTask}
              />
            )}
            {activeTab === "budget" && (
              <BudgetTab
                budgetItems={budgetItems}
                scopes={scopes}
                projectId={project.id}
                showForm={showBudgetForm}
                setShowForm={setShowBudgetForm}
                editingId={editingBudget}
                setEditingId={setEditingBudget}
                createBudgetItem={createBudgetItem}
                updateBudgetItem={updateBudgetItem}
                deleteBudgetItem={deleteBudgetItem}
                formatCurrency={formatCurrency}
              />
            )}
            {activeTab === "funds" && (
              <FundsTab
                funds={funds}
                projectId={project.id}
                fundSummary={fundSummary}
                fundAvailable={fundAvailable}
                showForm={showFundForm}
                setShowForm={setShowFundForm}
                createFund={createFund}
                deleteFund={deleteFund}
                formatCurrency={formatCurrency}
              />
            )}
            {activeTab === "monitor" && monitorData && (
              <MonitorTab data={monitorData} formatCurrency={formatCurrency} />
            )}
            {activeTab === "monitor" && !monitorData && (
              <div className="card p-8 text-center text-sm text-slate-500">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                Loading monitor data...
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// ============================================================
// Scopes Tab
// ============================================================
function ScopesTab({
  scopes,
  locations,
  projectId,
  showForm,
  setShowForm,
  editingId,
  setEditingId,
  createScope,
  updateScope,
  approveScope,
  deleteScope,
}: {
  scopes: Scope[];
  locations: { id: string; name: string }[];
  projectId: string;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  editingId: string | null;
  setEditingId: (v: string | null) => void;
  createScope: (data: ScopeFormData) => Promise<Scope | null>;
  updateScope: (id: string, data: Partial<ScopeFormData>) => Promise<boolean>;
  approveScope: (id: string) => Promise<boolean>;
  deleteScope: (id: string) => Promise<boolean>;
}) {
  const [form, setForm] = useState<ScopeFormData>({
    projectId,
    name: "",
    description: "",
    status: "draft",
    plannedKm: 0,
    plannedTransformers: 0,
    budgetAllocated: 0,
    locationId: "",
  });

  const handleOpen = (scope?: Scope) => {
    if (scope) {
      setForm({
        projectId,
        name: scope.name,
        description: scope.description || "",
        status: scope.status,
        plannedKm: scope.plannedKm,
        plannedTransformers: scope.plannedTransformers,
        budgetAllocated: scope.budgetAllocated,
        locationId: scope.locationId || "",
      });
      setEditingId(scope.id);
    } else {
      setForm({
        projectId,
        name: "",
        description: "",
        status: "draft",
        plannedKm: 0,
        plannedTransformers: 0,
        budgetAllocated: 0,
        locationId: "",
      });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateScope(editingId, form);
    } else {
      await createScope(form);
    }
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">Work Scopes</h2>
        <button onClick={() => handleOpen()} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Scope
        </button>
      </div>

      {scopes.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          <Target className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          No scopes defined yet. Create a scope to define work areas.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {scopes.map((scope, i) => (
            <motion.div
              key={scope.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900">{scope.name}</h3>
                  {scope.description && (
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{scope.description}</p>
                  )}
                </div>
                <span className={`status-pill ${
                  scope.status === "active" ? "bg-emerald-100 text-emerald-700" :
                  scope.status === "completed" ? "bg-blue-100 text-blue-700" :
                  scope.status === "cancelled" ? "bg-rose-100 text-rose-700" :
                  "bg-slate-100 text-slate-700"
                }`}>
                  {scopeStatusLabels[scope.status]}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="text-[9px] font-semibold uppercase text-slate-500">Planned KM</p>
                  <p className="font-display text-sm font-bold text-slate-900">{scope.plannedKm}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="text-[9px] font-semibold uppercase text-slate-500">Transformers</p>
                  <p className="font-display text-sm font-bold text-slate-900">{scope.plannedTransformers}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="text-[9px] font-semibold uppercase text-slate-500">Budget</p>
                  <p className="font-display text-sm font-bold text-slate-900">
                    {new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(scope.budgetAllocated)}
                  </p>
                </div>
              </div>
              {scope.locationName && (
                <p className="text-[10px] text-slate-500">📍 {scope.locationName}</p>
              )}
              <div className="flex items-center gap-1 pt-1">
                {scope.status === "draft" && (
                  <button
                    onClick={() => approveScope(scope.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Approve
                  </button>
                )}
                <button
                  onClick={() => handleOpen(scope)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => deleteScope(scope.id)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <Modal onClose={() => setShowForm(false)} title={editingId ? "Edit Scope" : "New Scope"}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="input-label">Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  placeholder="Scope name"
                />
              </div>
              <div>
                <label className="input-label">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field min-h-[50px] resize-none"
                />
              </div>
              <div>
                <label className="input-label">Location</label>
                <select
                  value={form.locationId}
                  onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select location...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="input-label">Planned KM</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={form.plannedKm}
                    onChange={(e) => setForm({ ...form, plannedKm: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">Transformers</label>
                  <input
                    type="number"
                    min="0"
                    value={form.plannedTransformers}
                    onChange={(e) => setForm({ ...form, plannedTransformers: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">Budget (RWF)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.budgetAllocated}
                    onChange={(e) => setForm({ ...form, budgetAllocated: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ScopeStatus })}
                  className="input-field"
                >
                  {(Object.keys(scopeStatusLabels) as ScopeStatus[]).map((s) => (
                    <option key={s} value={s}>{scopeStatusLabels[s]}</option>
                  ))}
                </select>
              </div>
              <FormActions onCancel={() => setShowForm(false)} submitLabel={editingId ? "Update" : "Create"} />
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Tasks Tab
// ============================================================
function TasksTab({
  tasks,
  scopes,
  users,
  lines,
  transformers,
  projectId,
  showForm,
  setShowForm,
  editingId,
  setEditingId,
  createTask,
  updateTask,
  deleteTask,
}: {
  tasks: Task[];
  scopes: Scope[];
  users: { id: string; name: string }[];
  lines: { id: string; name: string }[];
  transformers: { id: string; name: string }[];
  projectId: string;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  editingId: string | null;
  setEditingId: (v: string | null) => void;
  createTask: (data: TaskFormData) => Promise<Task | null>;
  updateTask: (id: string, data: Partial<TaskFormData & { progressPct: number }>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
}) {
  const [form, setForm] = useState<TaskFormData>({
    projectId,
    scopeId: "",
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    assignedTo: "",
    lineId: "",
    transformerId: "",
    plannedStartDate: "",
    plannedEndDate: "",
  });

  const handleOpen = (task?: Task) => {
    if (task) {
      setForm({
        projectId,
        scopeId: task.scopeId || "",
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo || "",
        lineId: task.lineId || "",
        transformerId: task.transformerId || "",
        plannedStartDate: task.plannedStartDate || "",
        plannedEndDate: task.plannedEndDate || "",
      });
      setEditingId(task.id);
    } else {
      setForm({
        projectId,
        scopeId: "",
        title: "",
        description: "",
        status: "pending",
        priority: "medium",
        assignedTo: "",
        lineId: "",
        transformerId: "",
        plannedStartDate: "",
        plannedEndDate: "",
      });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateTask(editingId, form);
    } else {
      await createTask(form);
    }
    setShowForm(false);
  };

  const priorityColors: Record<TaskPriority, string> = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-amber-100 text-amber-700",
    critical: "bg-rose-100 text-rose-700",
  };

  const statusColors: Record<TaskStatus, string> = {
    pending: "bg-slate-100 text-slate-700",
    assigned: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">Task Allocation</h2>
        <button onClick={() => handleOpen()} className="btn-primary">
          <Plus className="w-4 h-4" /> Assign Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          <ListChecks className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          No tasks allocated yet. Assign tasks to site engineers.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50">
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Task</th>
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Status</th>
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Priority</th>
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Assigned To</th>
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Progress</th>
                  <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task, i) => (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-violet-50/20"
                  >
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-semibold text-slate-900">{task.title}</p>
                      {task.scopeName && (
                        <p className="text-[10px] text-slate-500">{task.scopeName}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`status-pill ${statusColors[task.status]}`}>
                        {taskStatusLabels[task.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`status-pill ${priorityColors[task.priority]}`}>
                        {taskPriorityLabels[task.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-semibold text-slate-700">
                        {task.assignedToName || "Unassigned"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-violet-700 rounded-full"
                            style={{ width: `${task.progressPct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-700">{task.progressPct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleOpen(task)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteTask(task.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <Modal onClose={() => setShowForm(false)} title={editingId ? "Edit Task" : "Assign Task"}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="input-label">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input-field"
                  placeholder="Task title"
                />
              </div>
              <div>
                <label className="input-label">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field min-h-[50px] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="input-label">Scope</label>
                  <select
                    value={form.scopeId}
                    onChange={(e) => setForm({ ...form, scopeId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">No scope</option>
                    {scopes.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Assign To</label>
                  <select
                    value={form.assignedTo}
                    onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select engineer...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="input-label">Line</label>
                  <select
                    value={form.lineId}
                    onChange={(e) => setForm({ ...form, lineId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">No specific line</option>
                    {lines.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Transformer</label>
                  <select
                    value={form.transformerId}
                    onChange={(e) => setForm({ ...form, transformerId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">No specific transformer</option>
                    {transformers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="input-label">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
                    className="input-field"
                  >
                    {(Object.keys(taskPriorityLabels) as TaskPriority[]).map((p) => (
                      <option key={p} value={p}>{taskPriorityLabels[p]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                    className="input-field"
                  >
                    {(Object.keys(taskStatusLabels) as TaskStatus[]).map((s) => (
                      <option key={s} value={s}>{taskStatusLabels[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="input-label">Planned Start</label>
                  <input
                    type="date"
                    value={form.plannedStartDate}
                    onChange={(e) => setForm({ ...form, plannedStartDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">Planned End</label>
                  <input
                    type="date"
                    value={form.plannedEndDate}
                    onChange={(e) => setForm({ ...form, plannedEndDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <FormActions onCancel={() => setShowForm(false)} submitLabel={editingId ? "Update" : "Assign"} />
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Budget Tab
// ============================================================
function BudgetTab({
  budgetItems,
  scopes,
  projectId,
  showForm,
  setShowForm,
  editingId,
  setEditingId,
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  formatCurrency,
}: {
  budgetItems: BudgetItem[];
  scopes: Scope[];
  projectId: string;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  editingId: string | null;
  setEditingId: (v: string | null) => void;
  createBudgetItem: (data: BudgetItemFormData) => Promise<BudgetItem | null>;
  updateBudgetItem: (id: string, data: Partial<BudgetItemFormData>) => Promise<boolean>;
  deleteBudgetItem: (id: string) => Promise<boolean>;
  formatCurrency: (n: number) => string;
}) {
  const [form, setForm] = useState<BudgetItemFormData>({
    projectId,
    scopeId: "",
    category: "",
    description: "",
    plannedAmount: 0,
    spentAmount: 0,
    committedAmount: 0,
    status: "planned",
  });

  const handleOpen = (item?: BudgetItem) => {
    if (item) {
      setForm({
        projectId,
        scopeId: item.scopeId || "",
        category: item.category,
        description: item.description || "",
        plannedAmount: item.plannedAmount,
        spentAmount: item.spentAmount,
        committedAmount: item.committedAmount,
        status: item.status,
      });
      setEditingId(item.id);
    } else {
      setForm({
        projectId,
        scopeId: "",
        category: "",
        description: "",
        plannedAmount: 0,
        spentAmount: 0,
        committedAmount: 0,
        status: "planned",
      });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateBudgetItem(editingId, form);
    } else {
      await createBudgetItem(form);
    }
    setShowForm(false);
  };

  const totalPlanned = budgetItems.reduce((s, b) => s + b.plannedAmount, 0);
  const totalSpent = budgetItems.reduce((s, b) => s + b.spentAmount, 0);
  const totalCommitted = budgetItems.reduce((s, b) => s + b.committedAmount, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">Budget Items</h2>
        <button onClick={() => handleOpen()} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Budget Item
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3">
          <p className="text-[10px] font-semibold uppercase text-slate-500">Total Planned</p>
          <p className="font-display text-base font-bold text-slate-900">{formatCurrency(totalPlanned)}</p>
        </div>
        <div className="card p-3">
          <p className="text-[10px] font-semibold uppercase text-slate-500">Total Spent</p>
          <p className="font-display text-base font-bold text-emerald-700">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="card p-3">
          <p className="text-[10px] font-semibold uppercase text-slate-500">Total Committed</p>
          <p className="font-display text-base font-bold text-amber-700">{formatCurrency(totalCommitted)}</p>
        </div>
      </div>

      {budgetItems.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          No budget items defined yet.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50">
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Category</th>
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Status</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Planned</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Spent</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Committed</th>
                  <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {budgetItems.map((item, i) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-violet-50/20"
                  >
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-semibold text-slate-900">{item.category}</p>
                      {item.description && (
                        <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{item.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`status-pill ${
                        item.status === "active" ? "bg-emerald-100 text-emerald-700" :
                        item.status === "exhausted" ? "bg-rose-100 text-rose-700" :
                        item.status === "closed" ? "bg-slate-100 text-slate-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {budgetItemStatusLabels[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-slate-900">
                      {formatCurrency(item.plannedAmount)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-emerald-700">
                      {formatCurrency(item.spentAmount)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-amber-700">
                      {formatCurrency(item.committedAmount)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleOpen(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteBudgetItem(item.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <Modal onClose={() => setShowForm(false)} title={editingId ? "Edit Budget Item" : "New Budget Item"}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="input-label">Category *</label>
                <input
                  type="text"
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Cables, Transformers, Labor"
                />
              </div>
              <div>
                <label className="input-label">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Scope</label>
                <select
                  value={form.scopeId}
                  onChange={(e) => setForm({ ...form, scopeId: e.target.value })}
                  className="input-field"
                >
                  <option value="">No scope</option>
                  {scopes.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="input-label">Planned (RWF)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.plannedAmount}
                    onChange={(e) => setForm({ ...form, plannedAmount: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">Spent (RWF)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.spentAmount}
                    onChange={(e) => setForm({ ...form, spentAmount: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">Committed (RWF)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.committedAmount}
                    onChange={(e) => setForm({ ...form, committedAmount: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as BudgetItemStatus })}
                  className="input-field"
                >
                  {(Object.keys(budgetItemStatusLabels) as BudgetItemStatus[]).map((s) => (
                    <option key={s} value={s}>{budgetItemStatusLabels[s]}</option>
                  ))}
                </select>
              </div>
              <FormActions onCancel={() => setShowForm(false)} submitLabel={editingId ? "Update" : "Create"} />
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Funds Tab
// ============================================================
function FundsTab({
  funds,
  projectId,
  fundSummary,
  fundAvailable,
  showForm,
  setShowForm,
  createFund,
  deleteFund,
  formatCurrency,
}: {
  funds: FundTransaction[];
  projectId: string;
  fundSummary: { totalAllocated: number; totalDisbursed: number; totalCommitted: number; totalRefunded: number };
  fundAvailable: number;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  createFund: (data: FundTransactionFormData) => Promise<FundTransaction | null>;
  deleteFund: (id: string) => Promise<boolean>;
  formatCurrency: (n: number) => string;
}) {
  const [form, setForm] = useState<FundTransactionFormData>({
    projectId,
    type: "allocation",
    amount: 0,
    description: "",
    reference: "",
    transactionDate: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createFund(form);
    setShowForm(false);
    setForm({
      projectId,
      type: "allocation",
      amount: 0,
      description: "",
      reference: "",
      transactionDate: new Date().toISOString().split("T")[0],
    });
  };

  const typeColors: Record<FundTransactionType, string> = {
    allocation: "bg-emerald-100 text-emerald-700",
    disbursement: "bg-rose-100 text-rose-700",
    commitment: "bg-amber-100 text-amber-700",
    refund: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">Fund Transactions</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="card p-3">
          <p className="text-[10px] font-semibold uppercase text-slate-500">Allocated</p>
          <p className="font-display text-base font-bold text-emerald-700">{formatCurrency(fundSummary.totalAllocated)}</p>
        </div>
        <div className="card p-3">
          <p className="text-[10px] font-semibold uppercase text-slate-500">Disbursed</p>
          <p className="font-display text-base font-bold text-rose-700">{formatCurrency(fundSummary.totalDisbursed)}</p>
        </div>
        <div className="card p-3">
          <p className="text-[10px] font-semibold uppercase text-slate-500">Committed</p>
          <p className="font-display text-base font-bold text-amber-700">{formatCurrency(fundSummary.totalCommitted)}</p>
        </div>
        <div className="card p-3 border-2 border-violet-200">
          <p className="text-[10px] font-semibold uppercase text-violet-700">Available</p>
          <p className="font-display text-base font-bold text-violet-900">{formatCurrency(fundAvailable)}</p>
        </div>
      </div>

      {funds.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          <DollarSign className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          No fund transactions yet.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50">
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Date</th>
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Type</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Amount</th>
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Description</th>
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Reference</th>
                  <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {funds.map((fund, i) => (
                  <motion.tr
                    key={fund.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-violet-50/20"
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-[10px] text-slate-600 font-semibold">
                        {new Date(fund.transactionDate).toLocaleDateString("en-GB")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`status-pill ${typeColors[fund.type]}`}>
                        {fundTypeLabels[fund.type]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-slate-900">
                      {formatCurrency(fund.amount)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs text-slate-700">{fund.description || "—"}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-[10px] text-slate-500">{fund.reference || "—"}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center">
                        <button onClick={() => deleteFund(fund.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <Modal onClose={() => setShowForm(false)} title="New Fund Transaction">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="input-label">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as FundTransactionType })}
                    className="input-field"
                  >
                    {(Object.keys(fundTypeLabels) as FundTransactionType[]).map((t) => (
                      <option key={t} value={t}>{fundTypeLabels[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Amount (RWF) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Transaction Date *</label>
                <input
                  type="date"
                  required
                  value={form.transactionDate}
                  onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Reference / Voucher</label>
                <input
                  type="text"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  className="input-field"
                />
              </div>
              <FormActions onCancel={() => setShowForm(false)} submitLabel="Create" />
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Monitor Tab
// ============================================================
function MonitorTab({
  data,
  formatCurrency,
}: {
  data: import("@/types").MonitorData;
  formatCurrency: (n: number) => string;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-slate-900">Progress Monitoring</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-violet-700" /> Scope Progress
          </h3>
          {data.scopeProgress.length === 0 ? (
            <p className="text-xs text-slate-500">No scopes to monitor.</p>
          ) : (
            <div className="space-y-2">
              {data.scopeProgress.map((scope) => {
                const kmPct = scope.plannedKm > 0 ? Math.min((scope.actualKm / scope.plannedKm) * 100, 100) : 0;
                const trPct = scope.plannedTransformers > 0 ? Math.min((scope.actualTransformers / scope.plannedTransformers) * 100, 100) : 0;
                return (
                  <div key={scope.id} className="rounded-xl border border-slate-200/60 p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900">{scope.name}</span>
                      <span className={`status-pill ${
                        scope.status === "active" ? "bg-emerald-100 text-emerald-700" :
                        scope.status === "completed" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {scopeStatusLabels[scope.status]}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-600 mb-0.5">
                          <span>Cable KM</span>
                          <span className="font-mono font-bold">{scope.actualKm.toFixed(1)} / {scope.plannedKm} km</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-violet-700 rounded-full" style={{ width: `${kmPct}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-600 mb-0.5">
                          <span>Transformers</span>
                          <span className="font-mono font-bold">{scope.actualTransformers} / {scope.plannedTransformers}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" style={{ width: `${trPct}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-emerald-700" /> Budget vs Actual
          </h3>
          {data.budgetVsActual.length === 0 ? (
            <p className="text-xs text-slate-500">No budget data.</p>
          ) : (
            <div className="space-y-2">
              {data.budgetVsActual.map((item) => {
                const pct = item.planned > 0 ? Math.min((item.spent / item.planned) * 100, 100) : 0;
                return (
                  <div key={item.category} className="rounded-xl border border-slate-200/60 p-2.5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-900">{item.category}</span>
                      <span className="font-mono text-[10px] font-bold text-slate-700">
                        {formatCurrency(item.spent)} / {formatCurrency(item.planned)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${
                        pct < 70 ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
                        pct < 90 ? "bg-gradient-to-r from-amber-400 to-amber-600" :
                        "bg-gradient-to-r from-rose-500 to-rose-700"
                      }`} style={{ width: `${pct}%` }} />
                    </div>
                    {item.committed > 0 && (
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        {formatCurrency(item.committed)} committed
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <ListChecks className="w-4 h-4 text-blue-700" /> Task Progress
          </h3>
          {data.taskProgress.length === 0 ? (
            <p className="text-xs text-slate-500">No task data.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {data.taskProgress.map((tp) => (
                <div key={`${tp.status}-${tp.priority}`} className="rounded-lg bg-slate-50 p-2">
                  <p className="text-[9px] font-semibold uppercase text-slate-500">
                    {taskStatusLabels[tp.status]} · {taskPriorityLabels[tp.priority]}
                  </p>
                  <p className="font-display text-base font-bold text-slate-900">{tp.count}</p>
                  <p className="text-[9px] text-slate-500">{Math.round(tp.avgProgress)}% avg</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-amber-700" /> Fund Availability
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-emerald-50 p-2">
              <p className="text-[9px] font-semibold uppercase text-emerald-700">Allocated</p>
              <p className="font-display text-sm font-bold text-emerald-800">{formatCurrency(data.fundAvailability.totalAllocated)}</p>
            </div>
            <div className="rounded-lg bg-rose-50 p-2">
              <p className="text-[9px] font-semibold uppercase text-rose-700">Disbursed</p>
              <p className="font-display text-sm font-bold text-rose-800">{formatCurrency(data.fundAvailability.totalDisbursed)}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2">
              <p className="text-[9px] font-semibold uppercase text-amber-700">Committed</p>
              <p className="font-display text-sm font-bold text-amber-800">{formatCurrency(data.fundAvailability.totalCommitted)}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2">
              <p className="text-[9px] font-semibold uppercase text-blue-700">Refunded</p>
              <p className="font-display text-sm font-bold text-blue-800">{formatCurrency(data.fundAvailability.totalRefunded)}</p>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-violet-50 to-emerald-50 border border-violet-200/60 p-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-violet-600 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-violet-900">Available Funds</p>
                <p className="font-display text-base font-bold text-violet-900">
                  {formatCurrency(
                    data.fundAvailability.totalAllocated -
                    data.fundAvailability.totalDisbursed -
                    data.fundAvailability.totalCommitted
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Shared Components
// ============================================================
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function FormActions({ onCancel, submitLabel }: { onCancel: () => void; submitLabel: string }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      <button type="submit" className="btn-primary">{submitLabel}</button>
    </div>
  );
}