import { create } from "zustand";
import type { User, UserRole, LoginFormData } from "@/types";
import { authApi, usersApi } from "@/services/api";

interface NewUserData {
  email: string;
  name: string;
  role: UserRole;
  branch?: string;
  password: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  users: User[];
  login: (data: LoginFormData) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  setUser: (u: User | null) => void;
  setToken: (t: string | null) => void;
  loadUsers: (role?: UserRole) => Promise<void>;
  addUser: (data: NewUserData) => Promise<User | null>;
  updateUser: (id: string, data: Partial<NewUserData>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  resetPassword: (id: string, newPassword: string) => Promise<boolean>;
  getUserById: (id: string) => User | undefined;
  getUsersByRole: (role: UserRole) => User[];
  toggleUserActive: (id: string) => boolean;
}

const getInitialState = () => {
  try {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? (JSON.parse(storedUser) as User) : null;
    const token = storedToken;
    return {
      user,
      token,
      isAuthenticated: !!(user && token),
    };
  } catch {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
    };
  }
};

export const useAuthStore = create<AuthState>((set, get) => {
  const initial = getInitialState();
  return {
    user: initial.user,
    token: initial.token,
    isAuthenticated: initial.isAuthenticated,
    loading: false,
    users: [],

    login: async (data: LoginFormData) => {
      set({ loading: true });
      try {
        const result = await authApi.login(data);
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        set({
          token: result.token,
          user: result.user,
          isAuthenticated: true,
          loading: false,
        });
        return true;
      } catch {
        set({ loading: false });
        return false;
      }
    },

    logout: () => {
      authApi.logout();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    },

    checkAuth: async () => {
      const { token } = get();
      if (!token) {
        set({ isAuthenticated: false, user: null });
        return false;
      }
      set({ loading: true });
      try {
        const user = await authApi.me();
        localStorage.setItem("user", JSON.stringify(user));
        set({
          user,
          isAuthenticated: true,
          loading: false,
        });
        return true;
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
        });
        return false;
      }
    },

    setUser: (u) => {
      if (u) {
        localStorage.setItem("user", JSON.stringify(u));
      } else {
        localStorage.removeItem("user");
      }
      set({ user: u, isAuthenticated: !!(u && get().token) });
    },

    setToken: (t) => {
      if (t) {
        localStorage.setItem("token", t);
      } else {
        localStorage.removeItem("token");
      }
      set({ token: t, isAuthenticated: !!(get().user && t) });
    },

    loadUsers: async (role) => {
      try {
        const params = role ? { role } : undefined;
        const list = await usersApi.list(params);
        set({ users: list });
      } catch {
        set({ users: [] });
      }
    },

    addUser: async (data) => {
      try {
        const newUser = await usersApi.create(data);
        set((state) => ({ users: [...state.users, newUser] }));
        return newUser;
      } catch {
        return null;
      }
    },

    updateUser: async (id, data) => {
      try {
        const updated = await usersApi.update(id, data);
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? updated : u)),
        }));
        if (get().user?.id === id) {
          localStorage.setItem("user", JSON.stringify(updated));
          set({ user: updated });
        }
        return true;
      } catch {
        return false;
      }
    },

    deleteUser: async (id) => {
      try {
        await usersApi.remove(id);
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
        }));
        return true;
      } catch {
        return false;
      }
    },

    resetPassword: async (id, newPassword) => {
      try {
        await usersApi.resetPassword(id, newPassword);
        return true;
      } catch {
        return false;
      }
    },

    getUserById: (id) => {
      return get().users.find((u) => u.id === id);
    },

    getUsersByRole: (role) => {
      return get().users.filter((u) => u.role === role);
    },

    toggleUserActive: (id) => {
      void id;
      return false;
    },
  };
});

export const roleHomeRoute: Record<UserRole, string> = {
  site_engineer: "/site-engineer",
  branch_manager: "/branch-manager",
  planning: "/planning",
  senior_management: "/management",
  it_engineer: "/it",
  trusted_admin: "/admin",
};
