import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "@/pages/Login";
import SiteEngineerDashboard from "@/pages/site-engineer/SiteEngineerDashboard";
import ProgressEntryForm from "@/pages/site-engineer/ProgressEntryForm";
import SubmissionHistory from "@/pages/site-engineer/SubmissionHistory";
import BranchManagerDashboard from "@/pages/branch-manager/BranchManagerDashboard";
import ReviewEntry from "@/pages/branch-manager/ReviewEntry";
import PublishedRecords from "@/pages/branch-manager/PublishedRecords";
import SeniorManagementDashboard from "@/pages/senior-management/SeniorManagementDashboard";
import ManagementRecords from "@/pages/senior-management/ManagementRecords";
import ITEngineerDashboard from "@/pages/it-engineer/ITEngineerDashboard";
import UserManagement from "@/pages/it-engineer/UserManagement";
import SystemMaintenance from "@/pages/it-engineer/SystemMaintenance";
import PlanningDashboard from "@/pages/planning/PlanningDashboard";
import Projects from "@/pages/planning/Projects";
import ProjectDetail from "@/pages/planning/ProjectDetail";
import NetworkAssets from "@/pages/planning/NetworkAssets";
import ProgressMonitor from "@/pages/planning/ProgressMonitor";
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
  const backTo =
    isAuthenticated && user ? roleHomeRoute[user.role] : "/login";
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
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Let's
            get you back on track.
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

        <Route
          path="/site-engineer"
          element={
            <ProtectedRoute allowedRoles={["site_engineer"]}>
              <SiteEngineerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/site-engineer/entry"
          element={
            <ProtectedRoute allowedRoles={["site_engineer"]}>
              <ProgressEntryForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/site-engineer/entry/:id"
          element={
            <ProtectedRoute allowedRoles={["site_engineer"]}>
              <ProgressEntryForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/site-engineer/history"
          element={
            <ProtectedRoute allowedRoles={["site_engineer"]}>
              <SubmissionHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/branch-manager"
          element={
            <ProtectedRoute allowedRoles={["branch_manager"]}>
              <BranchManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/branch-manager/review/:id"
          element={
            <ProtectedRoute allowedRoles={["branch_manager"]}>
              <ReviewEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/branch-manager/published"
          element={
            <ProtectedRoute allowedRoles={["branch_manager"]}>
              <PublishedRecords />
            </ProtectedRoute>
          }
        />

        <Route
          path="/management"
          element={
            <ProtectedRoute allowedRoles={["senior_management"]}>
              <SeniorManagementDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/management/records"
          element={
            <ProtectedRoute allowedRoles={["senior_management"]}>
              <ManagementRecords />
            </ProtectedRoute>
          }
        />

        <Route
          path="/it"
          element={
            <ProtectedRoute allowedRoles={["it_engineer"]}>
              <ITEngineerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/it/users"
          element={
            <ProtectedRoute allowedRoles={["it_engineer"]}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/it/system"
          element={
            <ProtectedRoute allowedRoles={["it_engineer"]}>
              <SystemMaintenance />
            </ProtectedRoute>
          }
        />

        {/* Planning / Management Portal Routes */}
        <Route
          path="/planning"
          element={
            <ProtectedRoute allowedRoles={["planning", "senior_management", "trusted_admin"]}>
              <PlanningDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planning/projects"
          element={
            <ProtectedRoute allowedRoles={["planning", "senior_management", "trusted_admin"]}>
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planning/projects/:id"
          element={
            <ProtectedRoute allowedRoles={["planning", "senior_management", "trusted_admin"]}>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planning/assets"
          element={
            <ProtectedRoute allowedRoles={["planning", "trusted_admin"]}>
              <NetworkAssets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planning/monitor"
          element={
            <ProtectedRoute allowedRoles={["planning", "senior_management", "trusted_admin"]}>
              <ProgressMonitor />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
