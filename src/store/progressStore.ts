import { create } from "zustand";
import type { ProgressEntry, ProgressFormData, EntryStatus } from "@/types";
import { progressApi } from "@/services/api";

interface ListParams {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

interface ProgressState {
  entries: ProgressEntry[];
  loading: boolean;
  error: string | null;
  fetchEntries: (params?: ListParams) => Promise<void>;
  fetchEntry: (id: string) => Promise<ProgressEntry | null>;
  addEntry: (
    data: ProgressFormData,
    siteEngineerId: string,
    siteEngineerName: string
  ) => Promise<ProgressEntry | null>;
  updateEntry: (id: string, data: Partial<ProgressFormData>) => Promise<boolean>;
  deleteEntry: (id: string) => Promise<boolean>;
  submitEntry: (id: string) => Promise<boolean>;
  approveEntry: (
    id: string,
    managerId: string,
    managerName: string
  ) => Promise<boolean>;
  publishEntry: (
    id: string,
    managerId: string,
    managerName: string
  ) => Promise<boolean>;
  rejectEntry: (id: string, comments: string) => Promise<boolean>;
  getEntriesByEngineer: (engineerId: string) => ProgressEntry[];
  getEntriesByStatus: (status: EntryStatus) => ProgressEntry[];
  getPendingReviews: () => ProgressEntry[];
  getPublishedEntries: () => ProgressEntry[];
  getEntryById: (id: string) => ProgressEntry | undefined;
  getStatsForEngineer: (engineerId: string) => {
    total: number;
    draft: number;
    submitted: number;
    published: number;
    rejected: number;
    avgProgress: number;
    transformersCommissioned: number;
  };
  getStatsForManager: () => {
    pending: number;
    published: number;
    rejected: number;
    totalThisWeek: number;
    avgProgress: number;
    transformersCommissioned: number;
  };
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  entries: [],
  loading: false,
  error: null,

  fetchEntries: async (params) => {
    set({ loading: true, error: null });
    try {
      const entries = await progressApi.list(params);
      set({ entries, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load entries",
      });
    }
  },

  fetchEntry: async (id) => {
    try {
      const entry = await progressApi.get(id);
      set((state) => ({
        entries: state.entries.some((e) => e.id === id)
          ? state.entries.map((e) => (e.id === id ? entry : e))
          : [...state.entries, entry],
      }));
      return entry;
    } catch {
      return null;
    }
  },

  addEntry: async (data, siteEngineerId, siteEngineerName) => {
    try {
      const payload = { ...data, siteEngineerId, siteEngineerName };
      const newEntry = await progressApi.create(payload);
      set((state) => ({
        entries: [newEntry, ...state.entries],
      }));
      return newEntry;
    } catch {
      return null;
    }
  },

  updateEntry: async (id, data) => {
    try {
      const updated = await progressApi.update(id, data);
      set((state) => ({
        entries: state.entries.map((e) => (e.id === id ? updated : e)),
      }));
      return true;
    } catch {
      return false;
    }
  },

  deleteEntry: async (id) => {
    try {
      await progressApi.remove(id);
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
      }));
      return true;
    } catch {
      return false;
    }
  },

  submitEntry: async (id) => {
    try {
      const updated = await progressApi.submit(id);
      set((state) => ({
        entries: state.entries.map((e) => (e.id === id ? updated : e)),
      }));
      return true;
    } catch {
      return false;
    }
  },

  approveEntry: async (id, _managerId, _managerName) => {
    try {
      const updated = await progressApi.approve(id);
      set((state) => ({
        entries: state.entries.map((e) => (e.id === id ? updated : e)),
      }));
      return true;
    } catch {
      return false;
    }
  },

  publishEntry: async (id, _managerId, _managerName) => {
    try {
      const updated = await progressApi.publish(id);
      set((state) => ({
        entries: state.entries.map((e) => (e.id === id ? updated : e)),
      }));
      return true;
    } catch {
      return false;
    }
  },

  rejectEntry: async (id, comments) => {
    try {
      const updated = await progressApi.reject(id, comments);
      set((state) => ({
        entries: state.entries.map((e) => (e.id === id ? updated : e)),
      }));
      return true;
    } catch {
      return false;
    }
  },

  getEntriesByEngineer: (engineerId) => {
    return get()
      .entries.filter((e) => e.siteEngineerId === engineerId)
      .sort(
        (a, b) =>
          new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
      );
  },

  getEntriesByStatus: (status) => {
    return get()
      .entries.filter((e) => e.status === status)
      .sort(
        (a, b) =>
          new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
      );
  },

  getPendingReviews: () => {
    return get()
      .entries.filter((e) => e.status === "submitted")
      .sort(
        (a, b) =>
          new Date(a.submittedAt || a.createdAt).getTime() -
          new Date(b.submittedAt || b.createdAt).getTime()
      );
  },

  getPublishedEntries: () => {
    return get()
      .entries.filter((e) => e.status === "published")
      .sort(
        (a, b) =>
          new Date(b.publishedAt || b.updatedAt).getTime() -
          new Date(a.publishedAt || a.updatedAt).getTime()
      );
  },

  getEntryById: (id) => {
    return get().entries.find((e) => e.id === id);
  },

  getStatsForEngineer: (engineerId) => {
    const entries = get().entries.filter(
      (e) => e.siteEngineerId === engineerId
    );
    return {
      total: entries.length,
      draft: entries.filter((e) => e.status === "draft").length,
      submitted: entries.filter((e) => e.status === "submitted").length,
      published: entries.filter((e) => e.status === "published").length,
      rejected: entries.filter((e) => e.status === "rejected").length,
      avgProgress:
        entries.length > 0
          ? entries.reduce((sum, e) => sum + e.progressPct, 0) / entries.length
          : 0,
      transformersCommissioned: entries.reduce(
        (sum, e) => sum + e.transformersCommissioned,
        0
      ),
    };
  },

  getStatsForManager: () => {
    const { entries } = get();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const thisWeekEntries = entries.filter(
      (e) => new Date(e.entryDate) >= oneWeekAgo
    );

    return {
      pending: entries.filter((e) => e.status === "submitted").length,
      published: entries.filter((e) => e.status === "published").length,
      rejected: entries.filter((e) => e.status === "rejected").length,
      totalThisWeek: thisWeekEntries.length,
      avgProgress:
        entries.length > 0
          ? entries.reduce((sum, e) => sum + e.progressPct, 0) / entries.length
          : 0,
      transformersCommissioned: entries.reduce(
        (sum, e) => sum + e.transformersCommissioned,
        0
      ),
    };
  },
}));
