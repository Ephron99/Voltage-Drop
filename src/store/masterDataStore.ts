import { create } from "zustand";
import type { Location, Line, Transformer, VoltageLevel } from "@/types";
import { masterApi } from "@/services/api";

interface MasterDataState {
  locations: Location[];
  lines: Line[];
  transformers: Transformer[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  fetchAll: () => Promise<void>;
  getLocationById: (id: string) => Location | undefined;
  getLineById: (id: string) => Line | undefined;
  getTransformerById: (id: string) => Transformer | undefined;
  getLinesByLocation: (locationId: string) => Line[];
  getTransformersByLine: (lineId: string) => Transformer[];
  getLinesByVoltageLevel: (level: VoltageLevel) => Line[];
  getLocationName: (id: string) => string;
  getLineName: (id: string) => string;
  getTransformerName: (id: string) => string;
}

export const useMasterDataStore = create<MasterDataState>((set, get) => ({
  locations: [],
  lines: [],
  transformers: [],
  loading: false,
  error: null,
  initialized: false,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [locations, lines, transformers] = await Promise.all([
        masterApi.getLocations(),
        masterApi.getLines(),
        masterApi.getTransformers(),
      ]);
      set({
        locations,
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
  getLineById: (id) => get().lines.find((l) => l.id === id),
  getTransformerById: (id) => get().transformers.find((t) => t.id === id),

  getLinesByLocation: (locationId) =>
    get().lines.filter((l) => l.locationId === locationId),

  getTransformersByLine: (lineId) =>
    get().transformers.filter((t) => t.lineId === lineId),

  getLinesByVoltageLevel: (level) =>
    get().lines.filter((l) => l.voltageLevel === level),

  getLocationName: (id) => get().getLocationById(id)?.name ?? "Unknown Location",
  getLineName: (id) => get().getLineById(id)?.name ?? "Unknown Line",
  getTransformerName: (id) => get().getTransformerById(id)?.name ?? "Unknown TRSFO",
}));
