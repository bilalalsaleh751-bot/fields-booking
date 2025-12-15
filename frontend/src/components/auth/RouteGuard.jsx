import { Navigate, useLocation } from "react-router-dom";

/**
 * Route Guard Component
 * Enforces role-based access control and redirects
 * All roles use unified /login page
 */
export default function RouteGuard({ children, allowedRoles = [] }) {
  const location = useLocation();

  const userToken = localStorage.getItem("userToken");
  const ownerToken = localStorage.getItem("ownerToken");
  const adminToken = localStorage.getItem("adminToken");
  const adminRole = localStorage.getItem("adminRole"); // "admin" or "super_admin"

  // Determine current role
  let currentRole = null;
  if (adminToken) {
    currentRole = adminRole || "admin"; // Could be "admin" or "super_admin"
  } else if (ownerToken) {
    currentRole = "owner";
  } else if (userToken) {
    currentRole = "user";
  }

  // If route requires specific roles and user doesn't have one
  if (allowedRoles.length > 0 && !currentRole) {
    // All roles use unified login
    return <Navigate to="/login" replace />;
  }

  // Check if current role is in allowedRoles
  // Special case: "admin" allowedRole also allows "super_admin"
  if (allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some(role => {
      if (role === "admin") {
        return currentRole === "admin" || currentRole === "super_admin";
      }
      return role === currentRole;
    });

    if (!hasAccess) {
      // Redirect based on actual role
      if (currentRole === "admin" || currentRole === "super_admin") {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (currentRole === "owner") {
        return <Navigate to="/owner/dashboard" replace />;
      } else if (currentRole === "user") {
        return <Navigate to="/" replace />;
      } else {
        return <Navigate to="/login" replace />;
      }
    }
  }

  // Block cross-role access for public routes
  if (currentRole === "admin" || currentRole === "super_admin") {
    // Admin/Super Admin cannot access user/owner/public booking routes
    const blockedRoutes = ["/discover", "/field/", "/booking/", "/account", "/owner"];
    const isBlocked = blockedRoutes.some(route => location.pathname.startsWith(route));
    
    if (isBlocked) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  } else if (currentRole === "owner") {
    // Owner cannot access admin/user/public booking routes
    const blockedRoutes = ["/discover", "/field/", "/booking/", "/account", "/admin"];
    const isBlocked = blockedRoutes.some(route => location.pathname.startsWith(route));
    
    if (isBlocked) {
      return <Navigate to="/owner/dashboard" replace />;
    }
  } else if (currentRole === "user") {
    // User cannot access admin/owner routes
    if (location.pathname.startsWith("/admin") || 
        location.pathname.startsWith("/owner")) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
