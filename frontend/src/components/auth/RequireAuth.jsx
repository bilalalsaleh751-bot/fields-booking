import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

/**
 * RequireAuth - Protects routes that need authentication
 * Uses initial auth state from localStorage while verifying with server
 */
export default function RequireAuth({ children }) {
  const { auth, loading } = useAuth();
  const location = useLocation();

  // CRITICAL: If we have initial auth from localStorage, render children while verifying
  // This prevents the redirect flash on page refresh
  if (loading && auth) {
    return children;
  }

  // Show loading only if we don't have any auth state yet
  if (loading && !auth) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!auth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * RequireRole - Protects routes that need specific role(s)
 * Uses initial auth state from localStorage while verifying with server
 */
export function RequireRole({ children, allowedRoles = [] }) {
  const { auth, loading } = useAuth();
  const location = useLocation();

  // CRITICAL: If we have initial auth from localStorage, use it while loading
  // This prevents the redirect flash on page refresh
  if (loading && auth) {
    // We have auth from localStorage, check if role matches while verifying
    const hasInitialAccess = allowedRoles.some((role) => {
      if (role === "admin") {
        return auth.role === "admin" || auth.role === "super_admin";
      }
      return auth.role === role;
    });
    
    if (hasInitialAccess) {
      // Role matches, render children while verifying
      return children;
    }
  }

  // Show loading only if we don't have any auth state yet
  if (loading && !auth) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!auth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  const hasAccess = allowedRoles.some((role) => {
    if (role === "admin") {
      return auth.role === "admin" || auth.role === "super_admin";
    }
    return auth.role === role;
  });

  if (!hasAccess) {
    // Redirect based on actual role
    if (auth.role === "admin" || auth.role === "super_admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (auth.role === "owner") {
      return <Navigate to="/owner/dashboard" replace />;
    } else if (auth.role === "user") {
      return <Navigate to="/" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

/**
 * PublicRoute - Blocks admin/owner from accessing public routes
 * Redirects admin/owner to their respective dashboards
 */
export function PublicRoute({ children }) {
  const { auth, loading } = useAuth();

  // If we have auth from localStorage, redirect immediately based on role
  // This prevents admin/owner from seeing public pages on refresh
  if (auth) {
    if (auth.role === "admin" || auth.role === "super_admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (auth.role === "owner") {
      return <Navigate to="/owner/dashboard" replace />;
    }
  }

  // Show loading only if we're verifying and might need to redirect
  if (loading && !auth) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div>Loading...</div>
      </div>
    );
  }

  return children;
}

