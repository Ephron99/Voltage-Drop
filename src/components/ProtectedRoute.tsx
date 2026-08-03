import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { UserRole } from "@/types";
import { useAuthStore, roleHomeRoute } from "@/store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Debug only if needed
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={roleHomeRoute[user.role]} replace />;
  }

  return <>{children}</>;
}

export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    return <Navigate to={roleHomeRoute[user.role]} replace />;
  }

  return <>{children}</>;
}
