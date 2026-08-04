import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
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
} from "lucide-react";
import { useMasterDataStore } from "@/store/masterDataStore";
import { useManagementStore } from "@/store/managementStore";
import { masterApi } from "@/services/api";
import { Navbar } from "@/components/Navbar";
import { branchStatusLabels } from "@/types";
import type { Location, Line, Transformer, Branch, BranchStatus, VoltageLevel } from "@/types";

const navItems = [
  { label: "Dashboard", path: "/planning", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Projects", path: "/planning/projects", icon: <FolderKanban className="w-4 h-4" /> },
  { label: "Network Assets", path: "/planning/assets", icon: <Network className="w-4 h-4" /> },
  { label: "Progress Monitor", path: "/planning/monitor", icon: <TrendingUp className="w-4 h-4" /> },
];

type AssetTab = "locations" | "lines" | "branches" | "transformers";

export default function NetworkAssets() {
  const { locations, lines, transformers, fetchAll, initialized } = useMasterDataStore();
  const { branches, fetchBranches, createBranch, updateBranch, deleteBranch } = useManagementStore();
  const [activeTab, setActiveTab] = useState<AssetTab>("locations");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) fetchAll();
    fetchBranches();
  }, [fetchAll, fetchBranches, initialized]);

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar role="planning" navItems={navItems} title="Management Portal" />

      <main className="container py-5 space-y-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[10px] font-semibold text-violet-700 uppercase tracking-wider">Network Configuration</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Network Assets</h1>
          <p className="text-slate-500 text-xs">Manage locations, lines, branches, and transformers</p>
        </motion.div>

        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
          {([
            { key: "locations", label: "Locations", icon: <MapPin className="w-3.5 h-3.5" />, count: locations.length },
            { key: "lines", label: "Lines", icon: <Cable className="w-3.5 h-3.5" />, count: lines.length },
            { key: "branches", label: "Branches", icon: <GitBranch className="w-3.5 h-3.5" />, count: branches.length },
            { key: "transformers", label: "Transformers", icon: <Zap className="w-3.5 h-3.5" />, count: transformers.length },
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
            {activeTab === "locations" && <LocationsTab locations={locations} />}
            {activeTab === "lines" && <LinesTab lines={lines} locations={locations} />}
            {activeTab === "branches" && (
              <BranchesTab branches={branches} lines={lines} locations={locations} createBranch={createBranch} updateBranch={updateBranch} deleteBranch={deleteBranch} />
            )}
            {activeTab === "transformers" && <TransformersTab transformers={transformers} lines={lines} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function LocationsTab({ locations }: { locations: Location[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", address: "", governorate: "" });

  const handleOpen = (loc?: Location) => {
    if (loc) {
      setForm({ name: loc.name, address: loc.address, governorate: loc.governorate });
      setEditingId(loc.id);
    } else {
      setForm({ name: "", address: "", governorate: "" });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await masterApi.updateLocation(editingId, form);
    } else {
      await masterApi.createLocation(form);
    }
    setShowForm(false);
    window.location.reload();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this location?")) {
      await masterApi.deleteLocation(id);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">Locations</h2>
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
              <FormActions onCancel={() => setShowForm(false)} submitLabel={editingId ? "Update" : "Create"} />
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function LinesTab({ lines, locations }: { lines: Line[]; locations: Location[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", voltageLevel: "MV" as VoltageLevel, locationId: "" });

  const handleOpen = (line?: Line) => {
    if (line) {
      setForm({ name: line.name, voltageLevel: line.voltageLevel, locationId: line.locationId });
      setEditingId(line.id);
    } else {
      setForm({ name: "", voltageLevel: "MV", locationId: "" });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await masterApi.updateLine(editingId, form);
    } else {
      await masterApi.createLine(form);
    }
    setShowForm(false);
    window.location.reload();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this line?")) {
      await masterApi.deleteLine(id);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">Lines</h2>
        <button onClick={() => handleOpen()} className="btn-primary"><Plus className="w-4 h-4" /> Add Line</button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead><tr className="border-b border-slate-200/80 bg-slate-50/50">
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Name</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Voltage</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Location</th>
              <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line, i) => (
                <motion.tr key={line.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <td className="px-4 py-2.5"><span className="text-xs font-semibold text-slate-900">{line.name}</span></td>
                  <td className="px-4 py-2.5"><span className={`status-pill ${line.voltageLevel === "MV" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{line.voltageLevel}</span></td>
                  <td className="px-4 py-2.5"><span className="text-xs text-slate-600">{locations.find((l) => l.id === line.locationId)?.name || "—"}</span></td>
                  <td className="px-4 py-2.5"><div className="flex items-center justify-center gap-1">
                    <button onClick={() => handleOpen(line)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(line.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                  </div></td>
                </motion.tr>
              ))}
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
              <div><label className="input-label">Location *</label>
                <select required value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })} className="input-field">
                  <option value="">Select location...</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
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

function BranchesTab({ branches, lines, locations, createBranch, updateBranch, deleteBranch }: {
  branches: Branch[]; lines: Line[]; locations: Location[];
  createBranch: (data: import("@/types").BranchFormData) => Promise<Branch | null>;
  updateBranch: (id: string, data: Partial<import("@/types").BranchFormData>) => Promise<boolean>;
  deleteBranch: (id: string) => Promise<boolean>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", lineId: "", lengthKm: 0, conductorType: "", status: "planned" as BranchStatus });

  const handleOpen = (branch?: Branch) => {
    if (branch) {
      setForm({ name: branch.name, lineId: branch.lineId, lengthKm: branch.lengthKm, conductorType: branch.conductorType || "", status: branch.status });
      setEditingId(branch.id);
    } else {
      setForm({ name: "", lineId: "", lengthKm: 0, conductorType: "", status: "planned" });
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">Branch Lines</h2>
        <button onClick={() => handleOpen()} className="btn-primary"><Plus className="w-4 h-4" /> Add Branch</button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead><tr className="border-b border-slate-200/80 bg-slate-50/50">
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Name</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Line</th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Length (km)</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Conductor</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Status</th>
              <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {branches.map((branch, i) => (
                <motion.tr key={branch.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <td className="px-4 py-2.5"><span className="text-xs font-semibold text-slate-900">{branch.name}</span></td>
                  <td className="px-4 py-2.5"><span className="text-xs text-slate-600">{branch.lineName || lines.find((l) => l.id === branch.lineId)?.name || "—"}</span></td>
                  <td className="px-4 py-2.5 text-right"><span className="font-mono text-xs font-bold text-slate-700">{branch.lengthKm}</span></td>
                  <td className="px-4 py-2.5"><span className="text-xs text-slate-600">{branch.conductorType || "—"}</span></td>
                  <td className="px-4 py-2.5"><span className={`status-pill ${branch.status === "energized" ? "bg-emerald-100 text-emerald-700" : branch.status === "under_construction" ? "bg-amber-100 text-amber-700" : branch.status === "decommissioned" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}`}>{branchStatusLabels[branch.status]}</span></td>
                  <td className="px-4 py-2.5"><div className="flex items-center justify-center gap-1">
                    <button onClick={() => handleOpen(branch)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteBranch(branch.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
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
              <div><label className="input-label">Line *</label>
                <select required value={form.lineId} onChange={(e) => setForm({ ...form, lineId: e.target.value })} className="input-field">
                  <option value="">Select line...</option>
                  {lines.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.voltageLevel})</option>)}
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

function TransformersTab({ transformers, lines }: { transformers: Transformer[]; lines: Line[] }) {
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
    if (editingId) {
      await masterApi.updateTransformer(editingId, form);
    } else {
      await masterApi.createTransformer(form);
    }
    setShowForm(false);
    window.location.reload();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this transformer?")) {
      await masterApi.deleteTransformer(id);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">Transformers</h2>
        <button onClick={() => handleOpen()} className="btn-primary"><Plus className="w-4 h-4" /> Add Transformer</button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead><tr className="border-b border-slate-200/80 bg-slate-50/50">
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Name</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Serial</th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Capacity (kVA)</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Line</th>
              <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-2.5">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {transformers.map((tr, i) => (
                <motion.tr key={tr.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <td className="px-4 py-2.5"><span className="text-xs font-semibold text-slate-900">{tr.name}</span></td>
                  <td className="px-4 py-2.5"><span className="font-mono text-[10px] text-slate-600">{tr.serialNumber}</span></td>
                  <td className="px-4 py-2.5 text-right"><span className="font-mono text-xs font-bold text-slate-700">{tr.capacityKVA}</span></td>
                  <td className="px-4 py-2.5"><span className="text-xs text-slate-600">{lines.find((l) => l.id === tr.lineId)?.name || "—"}</span></td>
                  <td className="px-4 py-2.5"><div className="flex items-center justify-center gap-1">
                    <button onClick={() => handleOpen(tr)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(tr.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                  </div></td>
                </motion.tr>
              ))}
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
                    {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
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