import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Network,
  TrendingUp,
  Plus,
  X,
  Pencil,
  Trash2,
  MapPin,
  Zap,
  GitBranch,
  Cable,
  Building2,
} from "lucide-react";
import { useMasterDataStore } from "@/store/masterDataStore";
import { useManagementStore } from "@/store/managementStore";
import { useHubStore } from "@/store/hubStore";
import { useAuthStore } from "@/store/authStore";
import { masterApi } from "@/services/api";
import { Navbar } from "@/components/Navbar";
import { branchStatusLabels } from "@/types";
import type { Location, Line, Transformer, Branch, BranchStatus, VoltageLevel, Hub } from "@/types";

const navItems = [
  { label: "Dashboard", path: "/hub-manager", icon: <LayoutDashboard className="w-4 h-4" /> },
  // { label: "Projects", path: "/hub-manager/projects", icon: <FolderKanban className="w-4 h-4" /> },
  { label: "Network Assets", path: "/hub-manager/assets", icon: <Network className="w-4 h-4" /> },
  { label: "Progress Monitor", path: "/hub-manager/monitor", icon: <TrendingUp className="w-4 h-4" /> },
];

type AssetTab = "hubs" | "branches" | "lines" | "transformers" | "locations";

export default function NetworkAssets() {
  const { user } = useAuthStore();
  const {
    locations,
    lines,
    transformers,
    fetchAll,
    initialized,
    addLocation,
    updateLocation,
    removeLocation,
    addLine,
    updateLine,
    removeLine,
    addTransformer,
    updateTransformer,
    removeTransformer,
  } = useMasterDataStore();
  const { branches, fetchBranches, createBranch, updateBranch, deleteBranch } = useManagementStore();
  const { hubs, fetchHubs } = useHubStore();
  const scopedToHub = user?.role === "hub_manager";
  const hubId = scopedToHub ? user.hubId : undefined;
  const visibleHubs = scopedToHub ? (hubId ? hubs.filter((hub) => hub.id === hubId) : []) : hubs;
  const visibleBranches = scopedToHub ? (hubId ? branches.filter((branch) => branch.hubId === hubId) : []) : branches;
  const visibleBranchIds = new Set(visibleBranches.map((branch) => branch.id));
  const visibleLines = scopedToHub ? lines.filter((line) => visibleBranchIds.has(line.branchId)) : lines;
  const visibleLineIds = new Set(visibleLines.map((line) => line.id));
  const visibleTransformers = scopedToHub ? transformers.filter((transformer) => visibleLineIds.has(transformer.lineId)) : transformers;
  const visibleLocations = scopedToHub ? (hubId ? locations.filter((location) => location.hubId === hubId) : []) : locations;
  const [activeTab, setActiveTab] = useState<AssetTab>("hubs");

  useEffect(() => {
    if (!initialized) fetchAll();
    fetchBranches(hubId);
    fetchHubs();
  }, [fetchAll, fetchBranches, fetchHubs, initialized, hubId]);

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar role="hub_manager" navItems={navItems} title="Hub Manager Portal" />

      <main className="container py-5 space-y-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[10px] font-semibold text-violet-700 uppercase tracking-wider">Network Configuration</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Network Assets</h1>
          <p className="text-slate-500 text-xs">
            {hubId ? `Managing assets within ${visibleHubs[0]?.name || "your assigned hub"}` : "Hierarchy: Hub → Branch → Line → Transformer"}
          </p>
        </motion.div>

        {user?.role === "hub_manager" && !hubId && (
          <div className="card p-4 text-sm text-amber-800 bg-amber-50 border-amber-200">
            Your account is not assigned to a hub. Contact an administrator before managing network assets.
          </div>
        )}

        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
          {([
            { key: "hubs", label: "Hubs", icon: <Building2 className="w-3.5 h-3.5" />, count: visibleHubs.length },
            { key: "branches", label: "Branches", icon: <GitBranch className="w-3.5 h-3.5" />, count: visibleBranches.length },
            { key: "lines", label: "Lines", icon: <Cable className="w-3.5 h-3.5" />, count: visibleLines.length },
            { key: "transformers", label: "Transformers", icon: <Zap className="w-3.5 h-3.5" />, count: visibleTransformers.length },
            { key: "locations", label: "Locations", icon: <MapPin className="w-3.5 h-3.5" />, count: visibleLocations.length },
          ] as { key: AssetTab; label: string; icon: React.ReactNode; count: number }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.key ? "border-violet-700 text-violet-700" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className="ml-1 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full">{tab.count}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {activeTab === "hubs" && <HubsTab hubs={visibleHubs} branches={visibleBranches} lines={visibleLines} transformers={visibleTransformers} />}
            {activeTab === "branches" && (
              <BranchesTab branches={visibleBranches} hubs={visibleHubs} createBranch={createBranch} updateBranch={updateBranch} deleteBranch={deleteBranch} hubId={hubId} />
            )}
            {activeTab === "lines" && (
              <LinesTab
                lines={visibleLines}
                branches={visibleBranches}
                hubs={visibleHubs}
                addLine={addLine}
                updateLine={updateLine}
                removeLine={removeLine}
              />
            )}
            {activeTab === "transformers" && (
              <TransformersTab
                transformers={visibleTransformers}
                lines={visibleLines}
                branches={visibleBranches}
                hubs={visibleHubs}
                addTransformer={addTransformer}
                updateTransformer={updateTransformer}
                removeTransformer={removeTransformer}
              />
            )}
            {activeTab === "locations" && (
              <LocationsTab
                locations={visibleLocations}
                hubs={visibleHubs}
                addLocation={addLocation}
                updateLocation={updateLocation}
                removeLocation={removeLocation}
                hubId={hubId}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function HubsTab({ hubs, branches, lines, transformers }: { hubs: Hub[]; branches: Branch[]; lines: Line[]; transformers: Transformer[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">Hubs (Top Level)</h2>
        <p className="text-xs text-slate-500">Hierarchy: Hub → Branches → Lines → Transformers</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {hubs.map((hub, i) => {
          const hubBranches = branches.filter(b => b.hubId === hub.id);
          const hubLines = lines.filter(l => hubBranches.some(b => b.id === l.branchId));
          const hubTransformers = transformers.filter(t => hubLines.some(l => l.id === t.lineId));
          return (
            <motion.div key={hub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-violet-700" />
                    <h3 className="text-sm font-bold text-slate-900">{hub.name}</h3>
                  </div>
                  <p className="text-[10px] text-violet-700 font-semibold mt-0.5">{hub.region}</p>
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
                    <div className="text-center">
                      <GitBranch className="w-3.5 h-3.5 text-indigo-500 mx-auto mb-0.5" />
                      <p className="text-xs font-bold text-slate-900">{hub.branchCount ?? hubBranches.length}</p>
                      <p className="text-[9px] text-slate-500">Branches</p>
                    </div>
                    <div className="text-center">
                      <Cable className="w-3.5 h-3.5 text-amber-600 mx-auto mb-0.5" />
                      <p className="text-xs font-bold text-slate-900">{hub.lineCount ?? hubLines.length}</p>
                      <p className="text-[9px] text-slate-500">Lines</p>
                    </div>
                    <div className="text-center">
                      <Zap className="w-3.5 h-3.5 text-emerald-600 mx-auto mb-0.5" />
                      <p className="text-xs font-bold text-slate-900">{hub.transformerCount ?? hubTransformers.length}</p>
                      <p className="text-[9px] text-slate-500">Transformers</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        {hubs.length === 0 && (
          <div className="col-span-full text-center py-8 text-slate-400 text-xs">No hubs configured. Contact an admin to create hubs.</div>
        )}
      </div>
    </div>
  );
}

function LocationsTab({
  locations,
  hubs,
  addLocation,
  updateLocation,
  removeLocation,
  hubId,
}: {
  locations: Location[];
  hubs: Hub[];
  addLocation: (loc: Location) => void;
  updateLocation: (id: string, data: Partial<Location>) => void;
  removeLocation: (id: string) => void;
  hubId?: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", address: "", governorate: "", hubId: hubId || "" });

  const handleOpen = (loc?: Location) => {
    if (loc) {
      setForm({ name: loc.name, address: loc.address, governorate: loc.governorate, hubId: loc.hubId || "" });
      setEditingId(loc.id);
    } else {
      setForm({ name: "", address: "", governorate: "", hubId: hubId || "" });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const updated = await masterApi.updateLocation(editingId, form);
        updateLocation(editingId, updated);
      } else {
        const created = await masterApi.createLocation(form);
        addLocation(created);
      }
      setShowForm(false);
    } catch (err) {
      console.error("Failed to save location:", err);
      alert("Failed to save location. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this location?")) {
      try {
        await masterApi.deleteLocation(id);
        removeLocation(id);
      } catch (err) {
        console.error("Failed to delete location:", err);
        alert("Failed to delete location. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">Locations (Physical Sites)</h2>
        <button onClick={() => handleOpen()} className="btn-primary"><Plus className="w-4 h-4" /> Add Location</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {locations.map((loc, i) => (
          <motion.div key={loc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900">{loc.name}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{loc.address}</p>
                <p className="text-[10px] text-violet-700 font-semibold mt-0.5">{loc.governorate}</p>
                {loc.hubId && (
                  <p className="text-[10px] text-slate-500 mt-0.5">Hub: {hubs.find(h => h.id === loc.hubId)?.name || "—"}</p>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleOpen(loc)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(loc.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {showForm && (
          <Modal onClose={() => setShowForm(false)} title={editingId ? "Edit Location" : "New Location"}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="input-label">Name *</label><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
              <div><label className="input-label">Address *</label><input type="text" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" /></div>
              <div><label className="input-label">Governorate *</label><input type="text" required value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })} className="input-field" /></div>
              <div><label className="input-label">Hub</label>
                <select required value={form.hubId} onChange={(e) => setForm({ ...form, hubId: e.target.value })} className="input-field" disabled={Boolean(hubId)}>
                  {!hubId && <option value="">Not linked to a hub</option>}
                  {hubs.map((h) => <option key={h.id} value={h.id}>{h.name} ({h.region})</option>)}
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

function LinesTab({
  lines,
  branches,
  hubs,
  addLine,
  updateLine,
  removeLine,
}: {
  lines: Line[];
  branches: Branch[];
  hubs: Hub[];
  addLine: (line: Line) => void;
  updateLine: (id: string, data: Partial<Line>) => void;
  removeLine: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", voltageLevel: "MV" as VoltageLevel, branchId: "" });

  const handleOpen = (line?: Line) => {
    if (line) {
      setForm({ name: line.name, voltageLevel: line.voltageLevel, branchId: line.branchId });
      setEditingId(line.id);
    } else {
      setForm({ name: "", voltageLevel: "MV", branchId: "" });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const updated = await masterApi.updateLine(editingId, form);
        updateLine(editingId, updated);
      } else {
        const created = await masterApi.createLine(form);
        addLine(created);
      }
      setShowForm(false);
    } catch (err) {
      console.error("Failed to save line:", err);
      alert("Failed to save line. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this line? All transformers on this line will also be deleted.")) {
      try {
        await masterApi.deleteLine(id);
        removeLine(id);
      } catch (err) {
        console.error("Failed to delete line:", err);
        alert("Failed to delete line. Please try again.");
      }
    }
  };

  const getBranchHub = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return { branchName: "—", hubName: "—" };
    const hub = hubs.find(h => h.id === branch.hubId);
    return { branchName: branch.name, hubName: hub?.name || "—" };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">Lines (Under Branches)</h2>
        <button onClick={() => handleOpen()} className="btn-primary"><Plus className="w-4 h-4" /> Add Line</button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead><tr className="border-b border-slate-200/80 bg-slate-50/50">
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Name</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Voltage</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Branch</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Hub</th>
              <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line, i) => {
                const { branchName, hubName } = getBranchHub(line.branchId);
                return (
                  <motion.tr key={line.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                    <td className="px-4 py-2.5"><span className="text-xs font-semibold text-slate-900">{line.name}</span></td>
                    <td className="px-4 py-2.5"><span className={`status-pill ${line.voltageLevel === "MV" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{line.voltageLevel}</span></td>
                    <td className="px-4 py-2.5"><span className="text-xs text-slate-600">{branchName}</span></td>
                    <td className="px-4 py-2.5"><span className="text-xs text-slate-500">{hubName}</span></td>
                    <td className="px-4 py-2.5"><div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleOpen(line)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(line.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                    </div></td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <AnimatePresence>
        {showForm && (
          <Modal onClose={() => setShowForm(false)} title={editingId ? "Edit Line" : "New Line"}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="input-label">Name *</label><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
              <div><label className="input-label">Voltage Level *</label>
                <select value={form.voltageLevel} onChange={(e) => setForm({ ...form, voltageLevel: e.target.value as VoltageLevel })} className="input-field">
                  <option value="MV">MV (Medium Voltage)</option>
                  <option value="LV">LV (Low Voltage)</option>
                </select>
              </div>
              <div><label className="input-label">Branch *</label>
                <select required value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="input-field">
                  <option value="">Select branch...</option>
                  {branches.map((b) => {
                    const hub = hubs.find(h => h.id === b.hubId);
                    return <option key={b.id} value={b.id}>{b.name} ({hub?.name || "No Hub"})</option>;
                  })}
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

function BranchesTab({ branches, hubs, createBranch, updateBranch, deleteBranch, hubId }: {
  branches: Branch[]; hubs: Hub[];
  createBranch: (data: import("@/types").BranchFormData) => Promise<Branch | null>;
  updateBranch: (id: string, data: Partial<import("@/types").BranchFormData>) => Promise<boolean>;
  deleteBranch: (id: string) => Promise<boolean>;
  hubId?: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", hubId: hubId || "", lengthKm: 0, conductorType: "", status: "planned" as BranchStatus });

  const handleOpen = (branch?: Branch) => {
    if (branch) {
      setForm({ name: branch.name, hubId: branch.hubId, lengthKm: branch.lengthKm, conductorType: branch.conductorType || "", status: branch.status });
      setEditingId(branch.id);
    } else {
      setForm({ name: "", hubId: hubId || "", lengthKm: 0, conductorType: "", status: "planned" });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateBranch(editingId, form);
    } else {
      await createBranch(form);
    }
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this branch? All lines and transformers under this branch will also be deleted.")) {
      await deleteBranch(id);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">Branches (Under Hubs)</h2>
        <button onClick={() => handleOpen()} className="btn-primary"><Plus className="w-4 h-4" /> Add Branch</button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead><tr className="border-b border-slate-200/80 bg-slate-50/50">
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Name</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Hub</th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Length (km)</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Conductor</th>
              <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Lines</th>
              <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">TRSFO</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Status</th>
              <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {branches.map((branch, i) => (
                <motion.tr key={branch.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <td className="px-4 py-2.5"><span className="text-xs font-semibold text-slate-900">{branch.name}</span></td>
                  <td className="px-4 py-2.5"><span className="text-xs text-slate-600">{branch.hubName || hubs.find(h => h.id === branch.hubId)?.name || "—"}</span></td>
                  <td className="px-4 py-2.5 text-right"><span className="font-mono text-xs font-bold text-slate-700">{branch.lengthKm}</span></td>
                  <td className="px-4 py-2.5"><span className="text-xs text-slate-600">{branch.conductorType || "—"}</span></td>
                  <td className="px-4 py-2.5 text-center"><span className="font-mono text-xs font-bold text-amber-700">{branch.lineCount ?? 0}</span></td>
                  <td className="px-4 py-2.5 text-center"><span className="font-mono text-xs font-bold text-emerald-700">{branch.transformerCount ?? 0}</span></td>
                  <td className="px-4 py-2.5"><span className={`status-pill ${branch.status === "energized" ? "bg-emerald-100 text-emerald-700" : branch.status === "under_construction" ? "bg-amber-100 text-amber-700" : branch.status === "decommissioned" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}`}>{branchStatusLabels[branch.status]}</span></td>
                  <td className="px-4 py-2.5"><div className="flex items-center justify-center gap-1">
                    <button onClick={() => handleOpen(branch)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(branch.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                  </div></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <AnimatePresence>
        {showForm && (
          <Modal onClose={() => setShowForm(false)} title={editingId ? "Edit Branch" : "New Branch"}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="input-label">Name *</label><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
              <div><label className="input-label">Hub *</label>
                <select required value={form.hubId} onChange={(e) => setForm({ ...form, hubId: e.target.value })} className="input-field" disabled={Boolean(hubId)}>
                  <option value="">Select hub...</option>
                  {hubs.map((h) => <option key={h.id} value={h.id}>{h.name} ({h.region})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="input-label">Length (km)</label><input type="number" step="0.001" min="0" value={form.lengthKm} onChange={(e) => setForm({ ...form, lengthKm: Number(e.target.value) })} className="input-field" /></div>
                <div><label className="input-label">Conductor Type</label><input type="text" value={form.conductorType} onChange={(e) => setForm({ ...form, conductorType: e.target.value })} className="input-field" /></div>
              </div>
              <div><label className="input-label">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as BranchStatus })} className="input-field">
                  {(Object.keys(branchStatusLabels) as BranchStatus[]).map((s) => <option key={s} value={s}>{branchStatusLabels[s]}</option>)}
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

function TransformersTab({
  transformers,
  lines,
  branches,
  hubs,
  addTransformer,
  updateTransformer,
  removeTransformer,
}: {
  transformers: Transformer[];
  lines: Line[];
  branches: Branch[];
  hubs: Hub[];
  addTransformer: (tr: Transformer) => void;
  updateTransformer: (id: string, data: Partial<Transformer>) => void;
  removeTransformer: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", serialNumber: "", capacityKVA: 0, lineId: "" });

  const handleOpen = (tr?: Transformer) => {
    if (tr) {
      setForm({ name: tr.name, serialNumber: tr.serialNumber, capacityKVA: tr.capacityKVA, lineId: tr.lineId });
      setEditingId(tr.id);
    } else {
      setForm({ name: "", serialNumber: "", capacityKVA: 0, lineId: "" });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const updated = await masterApi.updateTransformer(editingId, form);
        updateTransformer(editingId, updated);
      } else {
        const created = await masterApi.createTransformer(form);
        addTransformer(created);
      }
      setShowForm(false);
    } catch (err) {
      console.error("Failed to save transformer:", err);
      alert("Failed to save transformer. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this transformer?")) {
      try {
        await masterApi.deleteTransformer(id);
        removeTransformer(id);
      } catch (err) {
        console.error("Failed to delete transformer:", err);
        alert("Failed to delete transformer. Please try again.");
      }
    }
  };

  const getLineInfo = (lineId: string) => {
    const line = lines.find(l => l.id === lineId);
    if (!line) return { lineName: "—", voltage: "—", branchName: "—", hubName: "—" };
    const branch = branches.find(b => b.id === line.branchId);
    const hub = branch ? hubs.find(h => h.id === branch.hubId) : null;
    return { lineName: line.name, voltage: line.voltageLevel, branchName: branch?.name || "—", hubName: hub?.name || "—" };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">Transformers (Under Lines)</h2>
        <button onClick={() => handleOpen()} className="btn-primary"><Plus className="w-4 h-4" /> Add Transformer</button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead><tr className="border-b border-slate-200/80 bg-slate-50/50">
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Name</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Serial</th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Capacity (kVA)</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Line</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Branch</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Hub</th>
              <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {transformers.map((tr, i) => {
                const info = getLineInfo(tr.lineId);
                return (
                  <motion.tr key={tr.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                    <td className="px-4 py-2.5"><span className="text-xs font-semibold text-slate-900">{tr.name}</span></td>
                    <td className="px-4 py-2.5"><span className="font-mono text-[10px] text-slate-600">{tr.serialNumber}</span></td>
                    <td className="px-4 py-2.5 text-right"><span className="font-mono text-xs font-bold text-slate-700">{tr.capacityKVA}</span></td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-600">{info.lineName}</span>
                        <span className={`status-pill text-[9px] ${info.voltage === "MV" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{info.voltage}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5"><span className="text-xs text-slate-500">{info.branchName}</span></td>
                    <td className="px-4 py-2.5"><span className="text-xs text-slate-500">{info.hubName}</span></td>
                    <td className="px-4 py-2.5"><div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleOpen(tr)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(tr.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                    </div></td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <AnimatePresence>
        {showForm && (
          <Modal onClose={() => setShowForm(false)} title={editingId ? "Edit Transformer" : "New Transformer"}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="input-label">Name *</label><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
              <div><label className="input-label">Serial Number *</label><input type="text" required value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="input-field" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="input-label">Capacity (kVA) *</label><input type="number" required min="0" value={form.capacityKVA} onChange={(e) => setForm({ ...form, capacityKVA: Number(e.target.value) })} className="input-field" /></div>
                <div><label className="input-label">Line *</label>
                  <select required value={form.lineId} onChange={(e) => setForm({ ...form, lineId: e.target.value })} className="input-field">
                    <option value="">Select line...</option>
                    {lines.map((l) => {
                      const branch = branches.find(b => b.id === l.branchId);
                      const hub = branch ? hubs.find(h => h.id === branch.hubId) : null;
                      return <option key={l.id} value={l.id}>{l.name} ({l.voltageLevel}) - {branch?.name || "No Branch"} / {hub?.name || "No Hub"}</option>;
                    })}
                  </select>
                </div>
              </div>
              <FormActions onCancel={() => setShowForm(false)} submitLabel={editingId ? "Update" : "Create"} />
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
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
