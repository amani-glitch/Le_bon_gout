import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/features/auth/useAuth";

function FullPageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isResolved, isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isResolved) return <FullPageLoader />;
  if (!isAuthenticated) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isResolved, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  if (!isResolved) return <FullPageLoader />;
  if (!isAuthenticated) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (!isAdmin) return <Navigate to="/menu" replace />;
  return <>{children}</>;
}
