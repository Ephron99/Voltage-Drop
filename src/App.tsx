import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "@/pages/Login";

// Branch Manager portal (covers field data entry + review)
import ProgressEntryForm from "@/pages/site-engineer/ProgressEntryForm";
import SubmissionHistory from "@/pages/site-engineer/SubmissionHistory";
import BranchManagerDashboard from "@/pages/branch-manager/BranchManagerDashboard";
import ReviewEntry from "@/pages/branch-manager/ReviewEntry";
import PublishedRecords from "@/pages/branch-manager/PublishedRecords";

// Hub Manager portal (planning + network assets + progress monitor)
import PlanningDashboard from "@/pages/planning/PlanningDashboard";
import Projects from "@/pages/planning/Projects";
import ProjectDetail from "@/pages/planning/ProjectDetail";
import NetworkAssets from "@/pages/planning/NetworkAssets";
import ProgressMonitor from "@/pages/planning/ProgressMonitor";

// Senior Manager + Admin portal
import SeniorManagementDashboard from "@/pages/senior-management/SeniorManagementDashboard";
import ManagementRecords from "@/pages/senior-management/ManagementRecords";
import ITEngineerDashboard from "@/pages/it-engineer/ITEngineerDashboard";
import UserManagement from "@/pages/it-engineer/UserManagement";
import SystemMaintenance from "@/pages/it-engineer/SystemMaintenance";

import { ProtectedRoute, RedirectIfAuthenticated } from "@/components/ProtectedRoute";
import { useAuthStore, roleHomeRoute } from "@/store/authStore";
import { Zap } from "lucide-react";

function RootRedirect() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(roleHomeRoute[user.role], { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-electric-grid">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 text-white shadow-lg">
          <Zap className="w-8 h-8 fill-current" />
        </div>
        <p className="font-display text-xl font-bold text-brand-900">
          Voltage Drop Monitoring System
        </p>
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

function NotFound() {
  const { isAuthenticated, user } = useAuthStore();
  const backTo = isAuthenticated && user ? roleHomeRoute[user.role] : "/login";
  return (
    <div className="min-h-screen flex items-center justify-center bg-electric-grid px-4">
      <div className="max-w-md w-full text-center space-y-6 card p-8">
        <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-brand-100 text-brand-700">
          <Zap className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <p className="font-display text-7xl font-bold tracking-tighter">
            4<span className="text-brand-700">0</span>4
          </p>
          <h1 className="font-display text-2xl font-bold text-slate-900">Page Not Found</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <button
          onClick={() => (window.location.href = backTo)}
          className="btn-primary w-full justify-center"
        >
          {isAuthenticated ? "Back to Dashboard" : "Go to Login"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route
          path="/login"
          element={
            <RedirectIfAuthenticated>
              <Login />
            </RedirectIfAuthenticated>
          }
        />

        {/* ── Branch Manager Portal ──────────────────────────────── */}
        {/* Dashboard (review/approve view) */}
        <Route
          path="/branch-manager"
          element={
            <ProtectedRoute allowedRoles={["branch_manager"]}>
              <BranchManagerDashboard />
            </ProtectedRoute>
          }
        />
        {/* Create New Progress Entry */}
        <Route
          path="/branch-manager/entry"
          element={
            <ProtectedRoute allowedRoles={["branch_manager"]}>
              <ProgressEntryForm />
            </ProtectedRoute>
          }
        />
        {/* Edit Existing Progress Entry */}
        <Route
          path="/branch-manager/entry/:id"
          element={
            <ProtectedRoute allowedRoles={["branch_manager"]}>
              <ProgressEntryForm />
            </ProtectedRoute>
          }
        />
        {/* My submission history */}
        <Route
          path="/branch-manager/history"
          element={
            <ProtectedRoute allowedRoles={["branch_manager"]}>
              <SubmissionHistory />
            </ProtectedRoute>
          }
        />
        {/* Review a submitted entry */}
        <Route
          path="/branch-manager/review/:id"
          element={
            <ProtectedRoute allowedRoles={["branch_manager"]}>
              <ReviewEntry />
            </ProtectedRoute>
          }
        />
        {/* Published records (branch manager view) */}
        <Route
          path="/branch-manager/published"
          element={
            <ProtectedRoute allowedRoles={["branch_manager"]}>
              <PublishedRecords />
            </ProtectedRoute>
          }
        />

        {/* ── Hub Manager Portal ─────────────────────────────────── */}
        <Route
          path="/hub-manager"
          element={
            <ProtectedRoute allowedRoles={["hub_manager"]}>
              <PlanningDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hub-manager/projects"
          element={
            <ProtectedRoute allowedRoles={["hub_manager"]}>
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hub-manager/projects/:id"
          element={
            <ProtectedRoute allowedRoles={["hub_manager"]}>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hub-manager/assets"
          element={
            <ProtectedRoute allowedRoles={["hub_manager"]}>
              <NetworkAssets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hub-manager/monitor"
          element={
            <ProtectedRoute allowedRoles={["hub_manager"]}>
              <ProgressMonitor />
            </ProtectedRoute>
          }
        />

        {/* ── Senior Manager Portal ─────────────────────────────── */}
        <Route
          path="/senior-manager"
          element={
            <ProtectedRoute allowedRoles={["senior_manager", "admin"]}>
              <SeniorManagementDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/senior-manager/records"
          element={
            <ProtectedRoute allowedRoles={["senior_manager", "admin"]}>
              <ManagementRecords />
            </ProtectedRoute>
          }
        />

        {/* ── Admin Portal ───────────────────────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ITEngineerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/system"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <SystemMaintenance />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
