import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  Shield,
  ShieldCheck,
  Activity,
  AlertCircle,
  LineChart,
  CheckCircle2,
  FileText,
  Users,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { UserRole } from "@/types";
import { roleLabels } from "@/types";
import { useAuthStore, roleHomeRoute } from "@/store/authStore";
import logoPng from "@/assets/logo.png";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(
    [
      "site_engineer",
      "branch_manager",
      "planning",
      "senior_management",
      "it_engineer",
      "trusted_admin",
    ],
    { required_error: "Please select your role" }
  ),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const availableRoles: UserRole[] = ["site_engineer", "branch_manager", "planning", "senior_management", "it_engineer"];

const roleIcons: Record<UserRole, React.ReactNode> = {
  site_engineer: <Shield className="w-4 h-4" />,
  branch_manager: <ShieldCheck className="w-4 h-4" />,
  planning: <FileText className="w-4 h-4" />,
  senior_management: <LineChart className="w-4 h-4" />,
  it_engineer: <Users className="w-4 h-4" />,
  trusted_admin: <Shield className="w-4 h-4" />,
};

const featureHighlights = [
  {
    icon: <Activity className="w-5 h-5" />,
    title: "Real-time Progress Tracking",
    description:
      "Capture daily site progress with accurate quantities and transformer status updates.",
  },
  {
    icon: <CheckCircle2 className="w-5 h-5" />,
    title: "Role-Based Approval Workflow",
    description:
      "Branch Managers review, validate, and publish data before it reaches dashboards.",
  },
  {
    icon: <LineChart className="w-5 h-5" />,
    title: "Automated Calculations",
    description:
      "Financial progress and completion metrics computed automatically with zero manual errors.",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState<UserRole | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "site_engineer",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);
    const success = await login(values as unknown as Parameters<typeof login>[0]);
    if (success) {
      const homeRoute = roleHomeRoute[values.role];
      navigate(homeRoute, { replace: true });
    } else {
      setAuthError(
        "Invalid credentials. Please check your email, password, and selected role."
      );
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    const demoUsers = {
      site_engineer: { email: "engineer@site.com", password: "password123" },
      branch_manager: { email: "manager@branch.com", password: "password123" },
      planning: { email: "planner@company.com", password: "password123" },
      senior_management: { email: "director@company.com", password: "password123" },
      it_engineer: { email: "admin@it.com", password: "password123" },
    };
    const creds = demoUsers[role];
    setValue("email", creds.email);
    setValue("password", creds.password);
    setValue("role", role);
    setAuthError(null);
    setDemoLoading(role);
    const success = await login({
      email: creds.email,
      password: creds.password,
      role,
    } as unknown as Parameters<typeof login>[0]);
    setDemoLoading(null);
    if (success) {
      const homeRoute = roleHomeRoute[role];
      navigate(homeRoute, { replace: true });
    } else {
      setAuthError(
        "Invalid credentials. Please check your email, password, and selected role."
      );
    }
  };

  return (
    <div className="min-h-screen bg-electric-grid bg-hero-gradient font-body text-slate-900">
      <div className="min-h-screen grid lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 text-white items-center justify-center p-10"
        >
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="grid"
                  width="48"
                  height="48"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 48 0 L 0 0 0 48"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.5"
                    opacity="0.2"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-amber-400/15 blur-3xl" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-10 max-w-lg w-full space-y-7"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-start"
            >
              </motion.div>

            <div className="pt-3 space-y-1">
              <h2 className="font-display text-3xl font-bold tracking-tight leading-tight">
                Voltage Drop
                <br />
                <span className="text-amber-300">Correction Project System</span>
              </h2>
              <p className="text-brand-200/80 text-sm leading-relaxed mt-3">
                Centralized platform for tracking, validating, and visualizing
                Rwanda Energy Group electrical infrastructure project progress
                across all stakeholders.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {featureHighlights.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                  className="flex gap-3.5 p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-300/20 text-amber-300 shrink-0">
                    {feature.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm leading-tight">
                      {feature.title}
                    </h3>
                    <p className="text-brand-200/70 text-xs mt-1 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <div className="flex items-center justify-center p-5 sm:p-7 lg:p-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full max-w-md space-y-5"
          >
            <div className="lg:hidden flex items-center gap-2.5 mb-1">
              <img src={logoPng} alt="Rwanda Energy Group" className="h-10 object-contain" />
              <div className="flex flex-col leading-tight">
                <span className="font-display text-sm font-bold text-brand-800 tracking-tight">
                  Voltage Drop
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Project Monitoring
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="font-display text-2xl font-bold tracking-tight text-slate-900"
              >
                 <img src={logoPng} alt="Rwanda Energy Group" className="h-14 object-contain" />
           
                Welcome back
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="text-slate-500 text-sm"
              >
                Sign in to access your project portal and track progress.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card p-1.5 bg-gradient-to-br from-slate-100 to-slate-50 border-slate-200"
            >
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1">
                {availableRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setValue("role", role)}
                    className={`relative px-2 py-2.5 rounded-xl text-[10px] font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      selectedRole === role
                        ? "bg-white text-brand-800 shadow-md shadow-slate-900/5"
                        : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
                    }`}
                  >
                    {roleIcons[role]}
                    <span>{roleLabels[role]}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.form
                key="login-form"
                onSubmit={handleSubmit(onSubmit)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.55, duration: 0.3 }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="input-label text-xs" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-11 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 hover:border-slate-300"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="input-label text-xs" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-slate-200 bg-white px-11 py-2.5 pr-11 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 hover:border-slate-300"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <AnimatePresence>
                  {authError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 rounded-xl bg-rose-50 border border-rose-200/60 flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-rose-700 leading-relaxed">
                        {authError}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ y: isSubmitting ? 0 : -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-700 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Sign In to Portal
                    </>
                  )}
                </motion.button>
              </motion.form>
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="pt-3 border-t border-slate-200/60 space-y-2.5"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                Quick Demo Login
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("site_engineer")}
                  disabled={demoLoading !== null}
                  className="py-2 px-2 rounded-xl text-[10px] font-semibold bg-slate-50 text-slate-700 border border-slate-200/60 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {demoLoading === "site_engineer" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Shield className="w-3.5 h-3.5" />
                  )}
                  Site Eng.
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("branch_manager")}
                  disabled={demoLoading !== null}
                  className="py-2 px-2 rounded-xl text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200/60 hover:bg-brand-100 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {demoLoading === "branch_manager" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  Branch Mgr.
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("planning")}
                  disabled={demoLoading !== null}
                  className="py-2 px-2 rounded-xl text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-200/60 hover:bg-violet-100 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {demoLoading === "planning" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  Planning
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("senior_management")}
                  disabled={demoLoading !== null}
                  className="py-2 px-2 rounded-xl text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {demoLoading === "senior_management" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LineChart className="w-3.5 h-3.5" />
                  )}
                  Mgmt
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("it_engineer")}
                  disabled={demoLoading !== null}
                  className="py-2 px-2 rounded-xl text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/60 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {demoLoading === "it_engineer" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wrench className="w-3.5 h-3.5" />
                  )}
                  IT Admin
                </button>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200/50 p-2.5">
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  <span className="font-semibold">Demo credentials:</span> Use
                  the buttons above or login manually with any email/password
                  combination from the meeting minutes.
                </p>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-center text-[11px] text-slate-400 pt-1"
            >
              © 2026 Rwanda Energy Group · Voltage Drop Project. Secure access portal.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
