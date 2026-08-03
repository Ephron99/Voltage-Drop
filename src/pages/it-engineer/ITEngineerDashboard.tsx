import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Settings,
  Shield,
  Server,
  Activity,
  Zap,
  HardDrive,
  Cpu,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ArrowRight,
  UserPlus,
  Wrench,
  FileSearch,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useProgressStore } from "@/store/progressStore";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { RoleBadge } from "@/components/StatusBadge";
import type { UserRole } from "@/types";
import { roleLabels } from "@/types";

const roleIcons: Record<UserRole, React.ReactNode> = {
  site_engineer: <Shield className="w-3.5 h-3.5" />,
  branch_manager: <ShieldCheck className="w-3.5 h-3.5" />,
  planning: <FileText className="w-3.5 h-3.5" />,
  senior_management: <Activity className="w-3.5 h-3.5" />,
  it_engineer: <Wrench className="w-3.5 h-3.5" />,
  trusted_admin: <Shield className="w-3.5 h-3.5" />,
};

const systemServices = [
  { name: "Auth Service", status: "operational", latency: "42ms", icon: <Shield className="w-4 h-4" /> },
  { name: "Database Cluster", status: "operational", latency: "18ms", icon: <Database className="w-4 h-4" /> },
  { name: "API Gateway", status: "operational", latency: "65ms", icon: <Server className="w-4 h-4" /> },
  { name: "CDN / Static Assets", status: "operational", latency: "12ms", icon: <Globe className="w-4 h-4" /> },
  { name: "Background Workers", status: "warning", latency: "—", icon: <Cpu className="w-4 h-4" /> },
  { name: "File Storage", status: "operational", latency: "38ms", icon: <HardDrive className="w-4 h-4" /> },
];

const recentActivities = [
  { time: "2 min ago", user: "Emmy ", action: "Updated user permissions", detail: "manager@branch.com", type: "user" },
  { time: "8 min ago", user: "System", action: "Automated backup completed", detail: "Full database snapshot", type: "system" },
  { time: "25 min ago", user: "Emmy ", action: "Created new user account", detail: "engineer3@site.com", type: "user" },
  { time: "1 hr ago", user: "System", action: "Security scan passed", detail: "0 vulnerabilities found", type: "security" },
  { time: "3 hr ago", user: "Emmy ", action: "Password reset", detail: "engineer2@site.com", type: "user" },
  { time: "6 hr ago", user: "System", action: "Scheduled maintenance window", detail: "Index optimization completed", type: "system" },
];

export default function ITEngineerDashboard() {
  const { user, users } = useAuthStore();
  const rawEntries = useProgressStore((s) => s.entries);

  const userStats = useMemo(() => {
    const counts: Record<UserRole, number> = {
      site_engineer: 0,
      branch_manager: 0,
      planning: 0,
      senior_management: 0,
      it_engineer: 0,
      trusted_admin: 0,
    };
    users.forEach((u) => {
      counts[u.role]++;
    });
    return counts;
  }, [users]);

  const platformStats = useMemo(() => {
    const activeLast24h = users.filter((u) => {
      if (!u.lastLoginAt) return false;
      const diff = Date.now() - new Date(u.lastLoginAt).getTime();
      return diff < 24 * 60 * 60 * 1000;
    }).length;

    const totalEntries = rawEntries.length;
    const lastWeekEntries = rawEntries.filter((e) => {
      const diff = Date.now() - new Date(e.createdAt).getTime();
      return diff < 7 * 24 * 60 * 60 * 1000;
    }).length;

    return {
      totalUsers: users.length,
      activeUsers: activeLast24h,
      totalEntries,
      lastWeekEntries,
      uptime: "99.98%",
      avgResponse: "38ms",
    };
  }, [users, rawEntries]);

  const usersByRole = useMemo(() => {
    return (Object.keys(userStats) as UserRole[]).map((role) => ({
      role,
      count: userStats[role],
      color: {
        site_engineer: "bg-blue-50 text-blue-700 border-blue-200",
        branch_manager: "bg-emerald-50 text-emerald-700 border-emerald-200",
        planning: "bg-violet-50 text-violet-700 border-violet-200",
        senior_management: "bg-amber-50 text-amber-700 border-amber-200",
        it_engineer: "bg-slate-100 text-slate-700 border-slate-200",
        trusted_admin: "bg-rose-50 text-rose-700 border-rose-200",
      }[role],
    }));
  }, [userStats]);

  const recentUsers = useMemo(
    () =>
      [...users]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5),
    [users]
  );

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar
        role="it_engineer"
        navItems={[
          {
            label: "Dashboard",
            path: "/it",
            icon: <LayoutDashboard className="w-4 h-4" />,
          },
          {
            label: "User Management",
            path: "/it/users",
            icon: <Users className="w-4 h-4" />,
          },
          {
            label: "System Maintenance",
            path: "/it/system",
            icon: <Settings className="w-4 h-4" />,
          },
        ]}
        title="IT Engineer Portal"
      />

      <main className="container py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-600">
              Welcome back, {user?.name.split(" ")[0]} 👋
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
              Platform Administration
            </h1>
            <p className="text-slate-500 text-sm">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {" · "}
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                All systems operational
              </span>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to="/it/users" className="btn-primary">
              <UserPlus className="w-4 h-4" />
              Manage Users
            </Link>
            <Link to="/it/system" className="btn-secondary">
              <Wrench className="w-4 h-4" />
              System Tools
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={platformStats.totalUsers}
            subtitle={`${platformStats.activeUsers} active in last 24h`}
            icon={<Users className="w-5 h-5" />}
            iconBg="bg-brand-50"
            iconColor="text-brand-700"
            delay={0.05}
            trend={{ direction: "up", value: "+2 this week" }}
          />
          <StatCard
            title="Platform Uptime"
            value={platformStats.uptime}
            subtitle="Last 30 days"
            icon={<Server className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-700"
            delay={0.1}
            trend={{ direction: "up", value: "SLA met" }}
          />
          <StatCard
            title="Total Records"
            value={platformStats.totalEntries}
            subtitle={`${platformStats.lastWeekEntries} created this week`}
            icon={<FileText className="w-5 h-5" />}
            iconBg="bg-violet-50"
            iconColor="text-violet-700"
            delay={0.15}
          />
          <StatCard
            title="Avg Response"
            value={platformStats.avgResponse}
            subtitle="API latency p95"
            icon={<Zap className="w-5 h-5 fill-current" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-700"
            delay={0.2}
            trend={{ direction: "down", value: "-4ms vs last wk" }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 card p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  System Services Status
                </h2>
                <p className="text-sm text-slate-500">
                  Real-time health of platform infrastructure
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                5 / 6 Healthy
              </div>
            </div>

            <div className="space-y-2">
              {systemServices.map((svc, i) => (
                <motion.div
                  key={svc.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                    svc.status === "operational"
                      ? "bg-white border-slate-200 hover:border-emerald-200"
                      : "bg-amber-50/60 border-amber-200/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-9 h-9 rounded-xl shadow-inner shrink-0 ${
                        svc.status === "operational"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {svc.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-tight">
                        {svc.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Latency: {svc.latency}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {svc.status === "operational" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        Operational
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        Warning
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <Link
              to="/it/system"
              className="btn-ghost w-full justify-center text-sm bg-slate-50 border border-slate-200"
            >
              View Full System Status
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card p-6 space-y-4"
          >
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Users by Role
              </h2>
              <p className="text-sm text-slate-500">Account distribution</p>
            </div>

            <div className="space-y-2.5">
              {usersByRole.map((item, i) => (
                <motion.div
                  key={item.role}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${item.color}`}
                      >
                        {roleIcons[item.role]}
                        {roleLabels[item.role]}
                      </span>
                    </div>
                    <span className="font-display text-sm font-bold text-slate-800">
                      {item.count}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width:
                          platformStats.totalUsers > 0
                            ? `${(item.count / platformStats.totalUsers) * 100}%`
                            : "0%",
                      }}
                      transition={{ duration: 0.6, delay: 0.55 + i * 0.05 }}
                      className={`h-full rounded-full ${
                        item.color.includes("emerald")
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                          : item.color.includes("brand") || item.color.includes("blue")
                          ? "bg-gradient-to-r from-brand-400 to-brand-700"
                          : item.color.includes("violet")
                          ? "bg-gradient-to-r from-violet-400 to-violet-600"
                          : item.color.includes("amber")
                          ? "bg-gradient-to-r from-amber-400 to-amber-600"
                          : item.color.includes("rose")
                          ? "bg-gradient-to-r from-rose-400 to-rose-600"
                          : "bg-gradient-to-r from-slate-400 to-slate-600"
                      }`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <Link
              to="/it/users"
              className="btn-ghost w-full justify-center text-sm bg-slate-50 border border-slate-200"
            >
              Open User Manager
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="lg:col-span-2 card p-6 space-y-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl shadow-inner bg-slate-100 text-slate-700">
                  <FileSearch className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Recent Activity Log
                  </h2>
                  <p className="text-sm text-slate-500">
                    Latest platform events and user actions
                  </p>
                </div>
              </div>
              <Link
                to="/it/system"
                className="text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
              >
                View Audit Trail
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-1 -mx-2">
              {recentActivities.map((act, i) => {
                const isUser = act.type === "user";
                const isSecurity = act.type === "security";
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.04 }}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className={`mt-0.5 flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                        isSecurity
                          ? "bg-emerald-50 text-emerald-700"
                          : isUser
                          ? "bg-brand-50 text-brand-700"
                          : "bg-violet-50 text-violet-700"
                      }`}
                    >
                      {isSecurity ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : isUser ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        <Settings className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-slate-800 leading-tight">
                          {act.action}
                        </p>
                        <span className="text-[11px] text-slate-400">·</span>
                        <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {act.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-600">{act.user}</span>
                        {" — "}
                        {act.detail}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card p-6 space-y-4"
          >
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Recently Created Users
              </h2>
              <p className="text-sm text-slate-500">Latest accounts onboarded</p>
            </div>

            <div className="space-y-2.5">
              {recentUsers.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No users yet</p>
                </div>
              ) : (
                recentUsers.map((u, i) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.05 }}
                    className="p-3 rounded-xl border border-slate-200 hover:border-brand-200 hover:bg-brand-50/30 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-sm font-semibold text-slate-800 leading-tight truncate">
                        {u.name}
                      </p>
                      <RoleBadge role={u.role} />
                    </div>
                    <p className="text-xs text-slate-500 truncate mb-1.5">
                      {u.email}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-slate-400">
                        Created {new Date(u.createdAt).toLocaleDateString("en-GB")}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                          u.lastLoginAt
                            ? "text-emerald-600"
                            : "text-slate-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.lastLoginAt ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        />
                        {u.lastLoginAt ? "Logged in" : "Never logged in"}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <Link
              to="/it/users"
              className="btn-ghost w-full justify-center text-sm bg-slate-50 border border-slate-200"
            >
              Manage All Users
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
