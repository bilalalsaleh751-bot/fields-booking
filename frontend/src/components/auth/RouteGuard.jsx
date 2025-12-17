import { Navigate, useLocation } from "react-router-dom";

/**
 * Route Guard Component
 * Enforces role-based access control with MULTI-SESSION support
 * 
 * KEY PRINCIPLE: Check for the SPECIFIC token required for each route
 * Based on URL PATH, not on a shared authRole
 * 
 * - /owner/* routes check ownerToken ONLY
 * - /admin/* routes check adminToken ONLY  
 * - /account/* routes check userToken ONLY
 * 
 * This allows multiple tabs with different roles to work independently
 */
export default function RouteGuard({ children, allowedRoles = [] }) {
  const location = useLocation();
  const path = location.pathname;

  // Get tokens directly - each is independent
  const userToken = localStorage.getItem("userToken");
  const ownerToken = localStorage.getItem("ownerToken");
  const adminToken = localStorage.getItem("adminToken");

  // ============================================================
  // PATH-BASED TOKEN CHECKING (prevents cross-tab conflicts)
  // Each route type only checks its own token
  // ============================================================
  
  // Admin routes - ONLY check adminToken
  if (path.startsWith("/admin")) {
    if (!adminToken) {
      return <Navigate to="/admin/login" replace />;
    }
    return children;
  }
  
  // Owner routes - ONLY check ownerToken
  if (path.startsWith("/owner")) {
    if (!ownerToken) {
      return <Navigate to="/owner/login" replace />;
    }
    return children;
  }
  
  // User account routes - ONLY check userToken
  if (path.startsWith("/account")) {
    if (!userToken) {
      return <Navigate to="/login" replace />;
    }
    return children;
  }

  // For routes with explicit allowedRoles (booking flow, etc.)
  if (allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some(role => {
      if (role === "admin" || role === "super_admin") return !!adminToken;
      if (role === "owner") return !!ownerToken;
      if (role === "user") return !!userToken;
      return false;
    });

    if (!hasAccess) {
      return <Navigate to="/login" replace />;
    }
  }

  // Public routes - allow access
  return children;
}
