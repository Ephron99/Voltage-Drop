import { create } from "zustand";
import type { Location, Line, Transformer, VoltageLevel, Hub, Branch } from "@/types";
import { masterApi, hubsApi, managementApi } from "@/services/api";

interface MasterDataState {
  locations: Location[];
  hubs: Hub[];
  branches: Branch[];
  lines: Line[];
  transformers: Transformer[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  fetchAll: () => Promise<void>;
  addLocation: (loc: Location) => void;
  updateLocation: (id: string, data: Partial<Location>) => void;
  removeLocation: (id: string) => void;
  addLine: (line: Line) => void;
  updateLine: (id: string, data: Partial<Line>) => void;
  removeLine: (id: string) => void;
  addTransformer: (tr: Transformer) => void;
  updateTransformer: (id: string, data: Partial<Transformer>) => void;
  removeTransformer: (id: string) => void;
  getLocationById: (id: string) => Location | undefined;
  getHubById: (id: string) => Hub | undefined;
  getBranchById: (id: string) => Branch | undefined;
  getLineById: (id: string) => Line | undefined;
  getTransformerById: (id: string) => Transformer | undefined;
  getBranchesByHub: (hubId: string) => Branch[];
  getLinesByBranch: (branchId: string) => Line[];
  getTransformersByLine: (lineId: string) => Transformer[];
  getLinesByVoltageLevel: (level: VoltageLevel) => Line[];
  getLocationName: (id: string) => string;
  getHubName: (id: string) => string;
  getBranchName: (id: string) => string;
  getLineName: (id: string) => string;
  getTransformerName: (id: string) => string;
}

export const useMasterDataStore = create<MasterDataState>((set, get) => ({
  locations: [],
  hubs: [],
  branches: [],
  lines: [],
  transformers: [],
  loading: false,
  error: null,
  initialized: false,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [locations, hubs, branches, lines, transformers] = await Promise.all([
        masterApi.getLocations(),
        hubsApi.list(),
        managementApi.listBranches(),
        masterApi.getLines(),
        masterApi.getTransformers(),
      ]);
      set({
        locations,
        hubs,
        branches,
        lines,
        transformers,
        loading: false,
        initialized: true,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load master data",
        initialized: false,
      });
    }
  },

  getLocationById: (id) => get().locations.find((l) => l.id === id),
  getHubById: (id) => get().hubs.find((h) => h.id === id),
  getBranchById: (id) => get().branches.find((b) => b.id === id),
  getLineById: (id) => get().lines.find((l) => l.id === id),
  getTransformerById: (id) => get().transformers.find((t) => t.id === id),

  getBranchesByHub: (hubId) =>
    get().branches.filter((b) => b.hubId === hubId),

  getLinesByBranch: (branchId) =>
    get().lines.filter((l) => l.branchId === branchId),

  getTransformersByLine: (lineId) =>
    get().transformers.filter((t) => t.lineId === lineId),

  getLinesByVoltageLevel: (level) =>
    get().lines.filter((l) => l.voltageLevel === level),

  getLocationName: (id) => get().getLocationById(id)?.name ?? "Unknown Location",
  getHubName: (id) => get().getHubById(id)?.name ?? "Unknown Hub",
  getBranchName: (id) => get().getBranchById(id)?.name ?? "Unknown Branch",
  getLineName: (id) => get().getLineById(id)?.name ?? "Unknown Line",
  getTransformerName: (id) => get().getTransformerById(id)?.name ?? "Unknown TRSFO",

  addLocation: (loc) => set({ locations: [...get().locations, loc] }),
  updateLocation: (id, data) =>
    set({
      locations: get().locations.map((l) =>
        l.id === id ? { ...l, ...data } : l
      ),
    }),
  removeLocation: (id) =>
    set({ locations: get().locations.filter((l) => l.id !== id) }),

  addLine: (line) => set({ lines: [...get().lines, line] }),
  updateLine: (id, data) =>
    set({
      lines: get().lines.map((l) =>
        l.id === id ? { ...l, ...data } : l
      ),
    }),
  removeLine: (id) =>
    set({ lines: get().lines.filter((l) => l.id !== id) }),

  addTransformer: (tr) => set({ transformers: [...get().transformers, tr] }),
  updateTransformer: (id, data) =>
    set({
      transformers: get().transformers.map((t) =>
        t.id === id ? { ...t, ...data } : t
      ),
    }),
  removeTransformer: (id) =>
    set({ transformers: get().transformers.filter((t) => t.id !== id) }),
}));
