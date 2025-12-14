import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

// ============================================================
// ADMIN AUTH MIDDLEWARE
// Protects admin routes and verifies JWT token
// ============================================================
export const protectAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized - No token" });
    }
    
    const token = authHeader.split(" ")[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "admin_secret_key");
    
    if (!decoded.adminId) {
      return res.status(401).json({ message: "Not authorized - Invalid token" });
    }
    
    const admin = await Admin.findById(decoded.adminId).select("-password");
    
    if (!admin) {
      return res.status(401).json({ message: "Not authorized - Admin not found" });
    }
    
    if (!admin.isActive) {
      return res.status(401).json({ message: "Account deactivated" });
    }
    
    req.admin = admin;
    next();
  } catch (err) {
    console.error("Admin auth error:", err);
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Not authorized - Invalid token" });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Not authorized - Token expired" });
    }
    return res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// RBAC PERMISSIONS
// ============================================================
const PERMISSIONS = {
  // Owner management
  approve_owner: ["super_admin", "admin"],
  reject_owner: ["super_admin", "admin"],
  suspend_owner: ["super_admin", "admin"],
  reactivate_owner: ["super_admin", "admin"],
  
  // Field management
  approve_field: ["super_admin", "admin"],
  reject_field: ["super_admin", "admin"],
  disable_field: ["super_admin", "admin"],
  block_field: ["super_admin", "admin"],
  edit_field: ["super_admin", "admin"],
  
  // Booking management
  view_bookings: ["super_admin", "admin", "support"],
  update_booking: ["super_admin", "admin"],
  handle_dispute: ["super_admin", "admin", "support"],
  
  // Financial
  view_financial: ["super_admin", "admin", "support"],
  update_commission: ["super_admin"], // Only super_admin
  
  // CMS
  manage_cms: ["super_admin", "admin"],
  
  // Notifications
  view_notifications: ["super_admin", "admin", "support"],
  send_broadcast: ["super_admin", "admin", "support"],
  manage_templates: ["super_admin", "admin"],
  
  // Settings
  view_settings: ["super_admin", "admin"],
  update_settings: ["super_admin"], // Only super_admin
  manage_cities: ["super_admin", "admin"],
  
  // Activity logs
  view_activity: ["super_admin", "admin"],
  
  // Dashboard
  view_dashboard: ["super_admin", "admin", "support"],
};

// ============================================================
// PERMISSION MIDDLEWARE
// ============================================================
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ message: "Not authorized" });
    }
    
    const allowedRoles = PERMISSIONS[permission];
    
    if (!allowedRoles) {
      console.error(`Unknown permission: ${permission}`);
      return res.status(500).json({ message: "Permission configuration error" });
    }
    
    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ 
        message: "Forbidden - Insufficient permissions",
        required: permission,
        yourRole: req.admin.role,
      });
    }
    
    next();
  };
};

// ============================================================
// HELPER: Check if admin has permission (for frontend)
// ============================================================
export const getAdminPermissions = (role) => {
  const permissions = {};
  
  for (const [perm, roles] of Object.entries(PERMISSIONS)) {
    permissions[perm] = roles.includes(role);
  }
  
  return permissions;
};

