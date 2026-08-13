import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Settings,
  Server,
  Shield,
  Database,
  HardDrive,
  Cpu,
  Wifi,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  FileSearch,
  Zap,
  Activity,
  FileText,
  BarChart3,
  Wrench,
  Play,
  Eye,
  ShieldCheck,
  Bug,
  Lock,
  Trash2,
  Archive,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useAuthStore } from "@/store/authStore";
import { useProgressStore } from "@/store/progressStore";

interface ServiceStatus {
  name: string;
  status: "operational" | "warning" | "offline";
  latency: string;
  uptime: string;
  icon: React.ReactNode;
  description: string;
}

const services: ServiceStatus[] = [
  { name: "Authentication Service", status: "operational", latency: "42ms", uptime: "99.99%", icon: <Shield className="w-5 h-5" />, description: "OAuth, session management, RBAC" },
  { name: "Primary Database", status: "operational", latency: "18ms", uptime: "99.98%", icon: <Database className="w-5 h-5" />, description: "MySQL 8.0 cluster (primary)" },
  { name: "API Gateway", status: "operational", latency: "65ms", uptime: "99.97%", icon: <Server className="w-5 h-5" />, description: "Rate limiting, routing, TLS" },
  { name: "Content Delivery Network", status: "operational", latency: "12ms", uptime: "100.0%", icon: <Globe className="w-5 h-5" />, description: "Static assets, cache hit 94%" },
  { name: "Background Worker Pool", status: "warning", latency: "—", uptime: "99.2%", icon: <Cpu className="w-5 h-5" />, description: "Email queue, report generation" },
  { name: "Object Storage", status: "operational", latency: "38ms", uptime: "99.95%", icon: <HardDrive className="w-5 h-5" />, description: "Attachments, backups, exports" },
  { name: "Redis Cache Layer", status: "operational", latency: "3ms", uptime: "99.99%", icon: <Zap className="w-5 h-5 fill-current" />, description: "Session, query cache, rate limits" },
  { name: "Application Servers", status: "operational", latency: "55ms", uptime: "99.98%", icon: <Wifi className="w-5 h-5" />, description: "4 replicas, rolling deployment" },
];

const systemResources = [
  { label: "CPU Usage", value: 34, unit: "%", trend: "down", color: "from-emerald-400 to-emerald-600" },
  { label: "Memory", value: 62, unit: "%", trend: "up", color: "from-brand-400 to-brand-700" },
  { label: "Disk I/O", value: 28, unit: "%", trend: "down", color: "from-amber-400 to-amber-600" },
  { label: "Network", value: 41, unit: "%", trend: "up", color: "from-violet-400 to-violet-600" },
];

const auditTrail = [
  { time: "09:42:15", date: "Today",     user: "Emmy ",        role: "admin",          action: "User Created",         target: "manager3@hub.com",      severity: "info" },
  { time: "09:25:33", date: "Today",     user: "Ahmad Fathy",  role: "hub_manager",    action: "Project Updated",      target: "VDP-2026-01 (active)",  severity: "info" },
  { time: "09:15:08", date: "Today",     user: "System",       role: "system",         action: "Automated Backup",     target: "Full DB + attachments", severity: "info" },
  { time: "08:52:44", date: "Today",     user: "Emmy ",        role: "admin",          action: "Password Reset",       target: "manager2@branch.com",   severity: "warning" },
  { time: "07:51:19", date: "Today",     user: "Theogene",     role: "branch_manager", action: "Entry Submitted",      target: "entry-012 (submitted)", severity: "info" },
  { time: "07:30:00", date: "Today",     user: "System",       role: "system",         action: "Scheduled Maintenance",target: "Index rebuild completed",severity: "info" },
  { time: "23:14:22", date: "Yesterday", user: "Security Bot", role: "system",         action: "Security Scan",        target: "0 vulnerabilities found",severity: "info" },
  { time: "18:03:56", date: "Yesterday", user: "Theogene",     role: "branch_manager", action: "Published Entry",      target: "entry-008 (published)", severity: "info" },
  { time: "16:45:11", date: "Yesterday", user: "Emmy ",        role: "admin",          action: "Role Updated",         target: "manager@branch.com",    severity: "warning" },
  { time: "14:22:33", date: "Yesterday", user: "Ephron",       role: "branch_manager", action: "Submitted Entry",      target: "entry-001 (submitted)", severity: "info" },
  { time: "11:08:19", date: "Yesterday", user: "System",       role: "system",         action: "Failed Login Attempt", target: "unknown user (IP blocked)",severity: "error" },
  { time: "09:00:00", date: "Yesterday", user: "System",       role: "system",         action: "Daily Rollup",         target: "Metrics aggregated",    severity: "info" },
  { time: "22:11:40", date: "2 days ago",user: "Emmy ",        role: "admin",          action: "User Deleted",         target: "old-user@site.com",     severity: "warning" },
  { time: "18:44:02", date: "2 days ago",user: "System",       role: "system",         action: "DB Backup",            target: "Snapshot vol-drop-20260810",severity: "info" },
  { time: "15:30:02", date: "2 days ago",user: "System",       role: "system",         action: "Backup Integrity Check",target: "All 14 snapshots valid",severity: "info" },
  { time: "09:15:08", date: "Today", user: "System", role: "system", action: "Automated Backup", target: "Full DB + attachments", severity: "info" },
  { time: "08:52:44", date: "Today",     user: "Emmy ",  role: "admin",          action: "Password Reset",  target: "manager2@branch.com",  severity: "warning" },
  { time: "07:30:00", date: "Today", user: "System", role: "system", action: "Scheduled Maintenance", target: "Index rebuild completed", severity: "info" },
  { time: "23:14:22", date: "Yesterday", user: "Security Bot", role: "system", action: "Security Scan", target: "0 vulnerabilities found", severity: "info" },
  { time: "18:03:56", date: "Yesterday", user: "Theogene", role: "branch_manager", action: "Published Entry", target: "entry-008 (published)", severity: "info" },
  { time: "16:45:11", date: "Yesterday", user: "Emmy ",  role: "admin",          action: "Role Updated",    target: "manager@branch.com",   severity: "warning" },
  { time: "14:22:33", date: "Yesterday", user: "Ephron", role: "branch_manager", action: "Submitted Entry", target: "entry-001 (submitted)", severity: "info" },
  { time: "11:08:19", date: "Yesterday", user: "System", role: "system", action: "Failed Login Attempt", target: "unknown user (IP blocked)", severity: "error" },
  { time: "09:00:00", date: "Yesterday", user: "System", role: "system", action: "Daily Rollup", target: "Metrics aggregated", severity: "info" },
  { time: "22:11:40", date: "2 days ago", user: "Emmy ", role: "admin",          action: "User Deleted",    target: "old-user@site.com",    severity: "warning" },
  { time: "15:30:02", date: "2 days ago", user: "System", role: "system", action: "Backup Integrity Check", target: "All 14 snapshots valid", severity: "info" },
];

const maintenanceTasks = [
  { id: 1, name: "Weekly database optimization", schedule: "Every Sunday 02:00", lastRun: "2 days ago", nextRun: "In 5 days", status: "ok", icon: <Database className="w-4 h-4" /> },
  { id: 2, name: "Backup integrity verification", schedule: "Daily 23:00", lastRun: "2 hours ago", nextRun: "In 22 hours", status: "ok", icon: <Archive className="w-4 h-4" /> },
  { id: 3, name: "Security vulnerability scan", schedule: "Every Mon & Thu 04:00", lastRun: "Yesterday", nextRun: "In 2 days", status: "ok", icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 4, name: "Cache invalidation & warmup", schedule: "Every 6 hours", lastRun: "3 hours ago", nextRun: "In 3 hours", status: "warning", icon: <RefreshCw className="w-4 h-4" /> },
  { id: 5, name: "Log rotation & archival", schedule: "Daily 00:30", lastRun: "9 hours ago", nextRun: "In 15 hours", status: "ok", icon: <FileText className="w-4 h-4" /> },
];

const severityStyles = {
  info: "bg-slate-50 text-slate-600 border-slate-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  error: "bg-rose-50 text-rose-700 border-rose-200",
};

const severityIcon = {
  info: <Activity className="w-3 h-3" />,
  warning: <AlertTriangle className="w-3 h-3" />,
  error: <Bug className="w-3 h-3" />,
};

export default function SystemMaintenance() {
  const { users } = useAuthStore();
  const { entries } = useProgressStore();
  const [refreshing, setRefreshing] = useState(false);
  const [auditFilter, setAuditFilter] = useState<"all" | "security" | "user" | "system">("all");
  const [toast, setToast] = useState<{ msg: string } | null>(null);

  const filteredAudit = useMemo(() => {
    return auditTrail.filter((e) => {
      if (auditFilter === "all") return true;
      if (auditFilter === "security")
        return ["error", "warning"].includes(e.severity) || e.action.toLowerCase().includes("security") || e.action.toLowerCase().includes("password") || e.action.toLowerCase().includes("login");
      if (auditFilter === "user")
        return ["User Created", "User Deleted", "Password Reset", "Role Updated"].includes(e.action);
      if (auditFilter === "system")
        return e.role === "system" || ["Automated Backup", "Scheduled Maintenance", "Daily Rollup", "Log rotation & archival", "Security Scan", "Backup Integrity Check"].includes(e.action);
      return true;
    });
  }, [auditFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    setToast({ msg: "System status refreshed" });
    setTimeout(() => {
      setRefreshing(false);
      setTimeout(() => setToast(null), 2500);
    }, 900);
  };

  const handleExport = () => {
    setToast({ msg: "Audit log export queued — check email" });
    setTimeout(() => setToast(null), 3000);
  };

  const handleTask = (taskName: string) => {
    setToast({ msg: `Triggered: ${taskName}` });
    setTimeout(() => setToast(null), 3000);
  };

  const totalStorageMB = 4872;
  const usedStorageMB = 2138;
  const storagePct = (usedStorageMB / totalStorageMB) * 100;

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
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0 }}
            className="fixed top-20 left-1/2 z-[100] px-4 py-2.5 rounded-xl shadow-lg border bg-emerald-50 border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {toast.msg}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-600">Platform Health</p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
              System Maintenance & Support
            </h1>
            <p className="text-slate-500 text-sm">
              Monitor infrastructure, manage maintenance tasks, and review the audit
              trail. <span className="text-rose-600 font-semibold">Operational data cannot be modified from this view.</span>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-secondary text-sm disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="btn-secondary text-sm"
            >
              <Download className="w-4 h-4" />
              Export Logs
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card p-4 flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-inner shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Services OK
              </p>
              <p className="font-display text-2xl font-bold text-slate-900">
                {services.filter((s) => s.status === "operational").length}
                <span className="text-sm text-slate-500 font-semibold ml-1">
                  / {services.length}
                </span>
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="card p-4 flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center shadow-inner shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                User Accounts
              </p>
              <p className="font-display text-2xl font-bold text-slate-900">
                {users.length}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.11 }}
            className="card p-4 flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center shadow-inner shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Records Stored
              </p>
              <p className="font-display text-2xl font-bold text-slate-900">
                {entries.length}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="card p-4 flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-inner shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Storage Used
              </p>
              <p className="font-display text-2xl font-bold text-slate-900">
                {(usedStorageMB / 1024).toFixed(1)}
                <span className="text-sm text-slate-500 font-semibold ml-1">
                  / {(totalStorageMB / 1024).toFixed(0)} GB
                </span>
              </p>
            </div>
          </motion.div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 space-y-5"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl shadow-inner bg-slate-100 text-slate-700">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Infrastructure Status
                </h2>
                <p className="text-sm text-slate-500">
                  Real-time service health and performance indicators
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live · Refreshed just now
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {services.map((svc, i) => (
              <motion.div
                key={svc.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.03 }}
                className={`rounded-2xl border p-4 transition-colors ${
                  svc.status === "operational"
                    ? "bg-white border-slate-200 hover:border-emerald-200 hover:shadow-sm"
                    : svc.status === "warning"
                    ? "bg-amber-50/60 border-amber-200"
                    : "bg-rose-50 border-rose-200"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl shadow-inner flex items-center justify-center ${
                      svc.status === "operational"
                        ? "bg-slate-100 text-slate-700"
                        : svc.status === "warning"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {svc.icon}
                  </div>
                  {svc.status === "operational" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      WARN
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-800 leading-tight">
                  {svc.name}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {svc.description}
                </p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                      Latency
                    </p>
                    <p className="text-xs font-bold text-slate-700">{svc.latency}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                      Uptime
                    </p>
                    <p className="text-xs font-bold text-emerald-700">{svc.uptime}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl shadow-inner bg-brand-50 text-brand-700">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  System Resources
                </h2>
                <p className="text-sm text-slate-500">
                  Current utilization across stack
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {systemResources.map((res, i) => (
                <motion.div
                  key={res.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-700">
                      {res.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600">
                      {res.value}
                      {res.unit}
                      <span
                        className={`text-[9px] ${
                          res.trend === "up" ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {res.trend === "up" ? "▲" : "▼"}
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${res.value}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.08 }}
                      className={`h-full bg-gradient-to-r ${res.color} rounded-full`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pt-4 mt-2 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Storage Pool</p>
                  <p className="text-[11px] text-slate-500">
                    Object storage volume · {storagePct.toFixed(0)}% of quota
                  </p>
                </div>
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${storagePct}%` }}
                  transition={{ duration: 0.9, delay: 0.7 }}
                  className="h-full bg-gradient-to-r from-brand-400 via-brand-600 to-brand-800 rounded-full"
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>{(usedStorageMB / 1024).toFixed(2)} GB used</span>
                <span>{((totalStorageMB - usedStorageMB) / 1024).toFixed(0)} GB free</span>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="lg:col-span-2 card p-6 space-y-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl shadow-inner bg-violet-50 text-violet-700">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Scheduled Maintenance
                  </h2>
                  <p className="text-sm text-slate-500">
                    Automated tasks — trigger manually if required
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {maintenanceTasks.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.04 }}
                  className="flex items-center gap-4 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50/30 transition-all"
                >
                  <div
                    className={`w-10 h-10 rounded-xl shadow-inner flex items-center justify-center shrink-0 ${
                      t.status === "ok"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800 leading-tight">
                        {t.name}
                      </p>
                      {t.status === "warning" && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          due soon
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      <Clock className="w-3 h-3 inline mr-1 -mt-0.5" />
                      {t.schedule}
                    </p>
                  </div>
                  <div className="hidden sm:block text-right shrink-0">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Last Run
                    </p>
                    <p className="text-xs font-semibold text-slate-700">{t.lastRun}</p>
                  </div>
                  <div className="hidden sm:block text-right shrink-0">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Next
                    </p>
                    <p className="text-xs font-semibold text-brand-700">{t.nextRun}</p>
                  </div>
                  <button
                    onClick={() => handleTask(t.name)}
                    title="Run now"
                    className="p-2 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition-colors shrink-0"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card p-6 space-y-4"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl shadow-inner bg-slate-100 text-slate-700">
                <FileSearch className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Audit Trail & Activity Log
                </h2>
                <p className="text-sm text-slate-500">
                  Immutable record of all security-relevant events.
                  <span className="text-rose-600 font-semibold ml-1">
                    (Operational data changes cannot be made here.)
                  </span>
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
              {([
                ["all", "All Events"],
                ["security", "Security"],
                ["user", "User Mgmt"],
                ["system", "System"],
              ] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setAuditFilter(val)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    auditFilter === val
                      ? "bg-white text-brand-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto -mx-6 px-6 scrollbar-thin">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 pr-4">
                    Timestamp
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 pr-4">
                    Actor
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 pr-4">
                    Event
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 pr-4">
                    Target
                  </th>
                  <th className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3">
                    Severity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAudit.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
                        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-slate-500">
                          <FileText className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-semibold text-slate-600">
                          No events match the current filter
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Try a different filter category or view all events.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAudit.map((evt, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.02 }}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-tight">
                              {evt.time}
                            </p>
                            <p className="text-[10px] text-slate-500">{evt.date}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 border ${
                              evt.role === "system"
                                ? "bg-violet-50 text-violet-700 border-violet-200"
                                : evt.role === "admin"
                                ? "bg-slate-100 text-slate-700 border-slate-200"
                                : "bg-brand-50 text-brand-700 border-brand-200"
                            }`}
                          >
                            {evt.role === "system" ? (
                              <Cpu className="w-4 h-4" />
                            ) : (
                              <Shield className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 leading-tight">
                              {evt.user}
                            </p>
                            <p className="text-[10px] text-slate-500 capitalize">
                              {evt.role.replace("_", " ")}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-semibold">
                          <Eye className="w-3 h-3" />
                          {evt.action}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="text-xs text-slate-700 font-medium truncate max-w-[280px]">
                          {evt.target}
                        </p>
                      </td>
                      <td className="py-3.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold ${severityStyles[evt.severity]}`}
                        >
                          {severityIcon[evt.severity]}
                          {evt.severity.toUpperCase()}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredAudit.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <p className="text-[11px] text-slate-500">
                Showing {filteredAudit.length} of {auditTrail.length} events
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Trash2 className="w-3.5 h-3.5" />
                Retention: 90 days
              </div>
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
}
