import { create } from "zustand";
import type { Hub } from "@/types";
import { hubsApi } from "@/services/api";

interface HubState {
  hubs: Hub[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  fetchHubs: () => Promise<void>;
  getHubById: (id: string) => Hub | undefined;
  getHubName: (id: string) => string;
}

export const useHubStore = create<HubState>((set, get) => ({
  hubs: [],
  loading: false,
  error: null,
  initialized: false,

  fetchHubs: async () => {
    if (get().initialized) return;
    set({ loading: true, error: null });
    try {
      const hubs = await hubsApi.list();
      set({ hubs, loading: false, initialized: true });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load hubs",
      });
    }
  },

  getHubById: (id) => get().hubs.find((h) => h.id === id),
  getHubName: (id) => get().hubs.find((h) => h.id === id)?.name ?? "Unknown Hub",
}));
