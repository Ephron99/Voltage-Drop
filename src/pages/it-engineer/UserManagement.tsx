import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Settings,
  Search,
  Plus,
  Edit3,
  Trash2,
  Shield,
  ShieldCheck,
  FileText,
  Activity,
  Wrench,
  X,
  Save,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
  Filter,
  User as UserIcon,
  Clock,
  Mail,
  Building2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { useAuthStore } from "@/store/authStore";
import { useHubStore } from "@/store/hubStore";
import { RoleBadge } from "@/components/StatusBadge";
import type { User, UserRole } from "@/types";
import { roleLabels } from "@/types";

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["branch_manager", "hub_manager", "senior_manager", "admin"]),
  branch: z.string().optional(),
  hubId: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

// Roles that require hub assignment
const HUB_REQUIRED_ROLES: UserRole[] = ["hub_manager", "branch_manager"];

const roleIcons: Record<UserRole, React.ReactNode> = {
  branch_manager: <Shield className="w-3.5 h-3.5" />,
  hub_manager: <ShieldCheck className="w-3.5 h-3.5" />,
  senior_manager: <Activity className="w-3.5 h-3.5" />,
  admin: <Wrench className="w-3.5 h-3.5" />,
};

export default function UserManagement() {
  const { user, users, addUser, updateUser, deleteUser, resetPassword, loadUsers } = useAuthStore();
  const { hubs, fetchHubs, initialized: hubsInitialized } = useHubStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!hubsInitialized) fetchHubs();
  }, [fetchHubs, hubsInitialized]);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPwUser, setResetPwUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.branch && u.branch.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const stats = useMemo(() => {
    const counts: Record<UserRole, number> = {
      branch_manager: 0,
      hub_manager: 0,
      senior_manager: 0,
      admin: 0,
    };
    users.forEach((u) => { if (u.role in counts) counts[u.role]++; });
    return counts;
  }, [users]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    formState: { errors: errorsAdd, isSubmitting: submittingAdd },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "branch_manager",
      branch: "",
      password: "",
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit, isSubmitting: submittingEdit },
  } = useForm<UserFormValues>({
    resolver: zodResolver(
      userSchema.partial().extend({
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        email: z.string().email("Please enter a valid email address").optional(),
      })
    ),
    defaultValues: {
      name: editingUser?.name,
      email: editingUser?.email,
      role: editingUser?.role,
      branch: editingUser?.branch,
      hubId: editingUser?.hubId,
      password: undefined,
    },
  });

  const openAdd = () => {
    resetAdd();
    setShowAddModal(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    resetEdit({
      name: u.name,
      email: u.email,
      role: u.role,
      branch: u.branch || "",
      hubId: u.hubId || "",
      password: undefined,
    });
  };

  const onAddUser = async (values: UserFormValues) => {
    if (!values.password) {
      showToast("Password is required for new users", "error");
      return;
    }
    const result = await addUser({
      name: values.name,
      email: values.email,
      role: values.role,
      branch: values.branch || undefined,
      hubId: values.hubId || undefined,
      password: values.password,
    });
    if (result) {
      showToast(`User "${values.name}" created successfully`);
      setShowAddModal(false);
      resetAdd();
    } else {
      showToast("Email already exists or failed to create user", "error");
    }
  };

  const onEditUser = async (values: Partial<UserFormValues>) => {
    if (!editingUser) return;
    const updateData: Partial<{
      name: string;
      email: string;
      role: UserRole;
      branch?: string;
      hubId?: string;
      password: string;
    }> = {};
    if (values.name !== undefined) updateData.name = values.name;
    if (values.email !== undefined) updateData.email = values.email;
    if (values.role !== undefined) updateData.role = values.role;
    if (values.branch !== undefined) updateData.branch = values.branch || undefined;
    if (values.hubId !== undefined) updateData.hubId = values.hubId || undefined;
    if (values.password) updateData.password = values.password;

    const ok = await updateUser(editingUser.id, updateData);
    if (ok) {
      showToast("User updated successfully");
      setEditingUser(null);
    } else {
      showToast("Failed to update user — email may be taken", "error");
    }
  };

  const onDeleteUser = async () => {
    if (!confirmDelete) return;
    const ok = await deleteUser(confirmDelete.id);
    if (ok) {
      showToast(`User "${confirmDelete.name}" deleted`);
    } else {
      showToast("Cannot delete your own account or operation failed", "error");
    }
    setConfirmDelete(null);
  };

  const onResetPassword = async () => {
    if (!resetPwUser || newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    const ok = await resetPassword(resetPwUser.id, newPassword);
    if (ok) {
      showToast(`Password reset for ${resetPwUser.name}`);
      setResetPwUser(null);
      setNewPassword("");
    } else {
      showToast("Failed to reset password", "error");
    }
  };

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar
        role="admin"
        navItems={[
          { label: "Dashboard",          path: "/admin",        icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: "User Management",    path: "/admin/users",  icon: <Users className="w-4 h-4" /> },
          { label: "System Maintenance", path: "/admin/system", icon: <Settings className="w-4 h-4" /> },
        ]}
        title="Admin Portal"
      />

      <main className="container py-8 space-y-6">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -20, x: "-50%" }}
              className={`fixed top-20 left-1/2 z-[100] px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 ${
                toast.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-600">IT Administration</p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
              User Management
            </h1>
            <p className="text-slate-500 text-sm">
              {filteredUsers.length} of {users.length} users · Manage accounts,
              permissions, and credentials — operational data remains read-only.
            </p>
          </div>
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add New User
          </button>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => setRoleFilter("all")}
            className={`p-3 rounded-xl border text-left transition-all ${
              roleFilter === "all"
                ? "bg-brand-50 border-brand-300 shadow-inner"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              All Users
            </p>
            <p className="font-display text-2xl font-bold text-slate-900 mt-0.5">
              {users.length}
            </p>
          </motion.button>
          {(Object.keys(stats) as UserRole[]).map((role, i) => (
            <motion.button
              key={role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.02 }}
              onClick={() => setRoleFilter(role)}
              className={`p-3 rounded-xl border text-left transition-all ${
                roleFilter === role
                  ? "bg-brand-50 border-brand-300 shadow-inner"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                {roleIcons[role]}
                {roleLabels[role].split(" ")[0]}
              </p>
              <p className="font-display text-2xl font-bold text-slate-900 mt-0.5">
                {stats[role]}
              </p>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card p-4 space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search users by name, email, or branch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-2.5 text-sm placeholder-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
              <Filter className="w-4 h-4" />
              Role: {roleFilter === "all" ? "All" : roleLabels[roleFilter]}
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 px-4 scrollbar-thin">
            <table className="w-full min-w-[880px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 pr-4">
                    User
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 pr-4">
                    Role
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 pr-4">
                    Hub / Branch
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 pr-4">
                    Created
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 pr-4">
                    Last Login
                  </th>
                  <th className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
                        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-slate-500">
                          <Users className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-semibold text-slate-600">
                          No users found
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Try adjusting your search or filters, or create a new
                          user account.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, i) => {
                    const isSelf = user?.id === u.id;
                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 + i * 0.02 }}
                        className={`hover:bg-slate-50/60 transition-colors ${
                          isSelf ? "bg-brand-50/30" : ""
                        }`}
                      >
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 border border-brand-200/50 shrink-0">
                              <UserIcon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 leading-tight flex items-center gap-2">
                                {u.name}
                                {isSelf && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 text-[9px] font-bold">
                                    YOU
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                                <Mail className="w-3 h-3" />
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex flex-col gap-0.5">
                            {u.hubName && (
                              <div className="flex items-center gap-1.5 text-xs text-brand-700 font-semibold">
                                <Building2 className="w-3.5 h-3.5 text-brand-500" />
                                {u.hubName}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              <Building2 className={`w-3.5 h-3.5 ${u.hubName ? "text-slate-300" : "text-slate-400"}`} />
                              {u.branch || (
                                <span className="text-slate-400 italic">—</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <p className="text-xs font-medium text-slate-700">
                            {new Date(u.createdAt).toLocaleDateString("en-GB")}
                          </p>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2">
                            {u.lastLoginAt ? (
                              <>
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <div>
                                  <p className="text-xs font-medium text-slate-700 leading-tight">
                                    {new Date(u.lastLoginAt).toLocaleDateString(
                                      "en-GB"
                                    )}
                                  </p>
                                  <p className="text-[10px] text-slate-500 inline-flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {new Date(u.lastLoginAt).toLocaleTimeString(
                                      "en-GB",
                                      { hour: "2-digit", minute: "2-digit" }
                                    )}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-semibold">
                                Never
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setResetPwUser(u)}
                              title="Reset password"
                              className="p-2 rounded-lg text-slate-500 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEdit(u)}
                              title="Edit user"
                              className="p-2 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(u)}
                              disabled={isSelf}
                              title={isSelf ? "Cannot delete yourself" : "Delete user"}
                              className={`p-2 rounded-lg transition-colors ${
                                isSelf
                                  ? "text-slate-300 cursor-not-allowed"
                                  : "text-slate-500 hover:text-rose-700 hover:bg-rose-50"
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filteredUsers.length > 0 && (
            <p className="text-center text-xs text-slate-500 pt-1">
              Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
            </p>
          )}
        </motion.div>
      </main>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md card p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900">
                    Add New User
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Create a new portal account with appropriate role access.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitAdd(onAddUser)} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="input-label text-xs">Full Name</label>
                  <input
                    className="input-field"
                    placeholder="e.g. John Doe"
                    {...registerAdd("name")}
                  />
                  {errorsAdd.name && (
                    <p className="text-xs text-rose-600">{errorsAdd.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="input-label text-xs">Email Address</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="john@company.com"
                    {...registerAdd("email")}
                  />
                  {errorsAdd.email && (
                    <p className="text-xs text-rose-600">{errorsAdd.email.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="input-label text-xs">Role</label>
                  <select className="input-field" {...registerAdd("role")}>
                    {(Object.keys(roleLabels) as UserRole[]).map((r) => (
                      <option key={r} value={r}>
                        {roleLabels[r]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="input-label text-xs">
                    Hub <span className="text-slate-400">(required for Hub Manager &amp; Branch Manager)</span>
                  </label>
                  <select className="input-field" {...registerAdd("hubId")}>
                    <option value="">— No Hub (nation-level role) —</option>
                    {hubs.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} · {h.region}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="input-label text-xs">
                    Branch <span className="text-slate-400">(optional — e.g. Kicukiro, Jabana)</span>
                  </label>
                  <input
                    className="input-field"
                    placeholder="e.g. Kicukiro"
                    {...registerAdd("branch")}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="input-label text-xs">Initial Password</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="min 6 characters"
                    {...registerAdd("password")}
                  />
                  {errorsAdd.password && (
                    <p className="text-xs text-rose-600">{errorsAdd.password.message}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-ghost flex-1 justify-center text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAdd}
                    className="btn-primary flex-1 justify-center text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Create User
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEditingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md card p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900">
                    Edit User
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Updating account:{" "}
                    <span className="font-semibold text-slate-700">{editingUser.email}</span>
                  </p>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitEdit(onEditUser)} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="input-label text-xs">Full Name</label>
                  <input className="input-field" {...registerEdit("name")} />
                  {errorsEdit.name && (
                    <p className="text-xs text-rose-600">{errorsEdit.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="input-label text-xs">Email Address</label>
                  <input
                    type="email"
                    className="input-field"
                    {...registerEdit("email")}
                  />
                  {errorsEdit.email && (
                    <p className="text-xs text-rose-600">{errorsEdit.email.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="input-label text-xs">Role</label>
                  <select className="input-field" {...registerEdit("role")}>
                    {(Object.keys(roleLabels) as UserRole[]).map((r) => (
                      <option key={r} value={r}>
                        {roleLabels[r]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="input-label text-xs">Hub</label>
                  <select className="input-field" {...registerEdit("hubId")}>
                    <option value="">— No Hub (nation-level role) —</option>
                    {hubs.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} · {h.region}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="input-label text-xs">Branch</label>
                  <input className="input-field" placeholder="e.g. Kicukiro" {...registerEdit("branch")} />
                </div>
                <div className="space-y-1.5">
                  <label className="input-label text-xs">
                    Reset Password <span className="text-slate-400">(blank = no change)</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="min 6 characters to change"
                    {...registerEdit("password")}
                  />
                  {errorsEdit.password && (
                    <p className="text-xs text-rose-600">{errorsEdit.password.message}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="btn-ghost flex-1 justify-center text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="btn-primary flex-1 justify-center text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resetPwUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setResetPwUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md card p-6 space-y-5"
            >
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-brand-700" />
                  Reset Password
                </h2>
                <p className="text-sm text-slate-500 mt-1.5">
                  Set a new password for{" "}
                  <span className="font-semibold text-slate-700">{resetPwUser.name}</span>.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="input-label text-xs">New Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  placeholder="min 6 characters"
                />
                {newPassword.length > 0 && newPassword.length < 6 && (
                  <p className="text-xs text-rose-600">
                    Password must be at least 6 characters
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setResetPwUser(null);
                    setNewPassword("");
                  }}
                  className="btn-ghost flex-1 justify-center text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={onResetPassword}
                  disabled={newPassword.length < 6}
                  className="btn-primary flex-1 justify-center text-sm disabled:opacity-60"
                >
                  Confirm Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md card p-6 space-y-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl font-bold text-slate-900">
                    Delete User?
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    This will permanently remove the account for{" "}
                    <span className="font-semibold text-slate-700">
                      {confirmDelete.name}
                    </span>{" "}
                    ({confirmDelete.email}). This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="btn-ghost flex-1 justify-center text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={onDeleteUser}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-rose-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 flex-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
