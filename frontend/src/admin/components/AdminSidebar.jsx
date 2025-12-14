// src/admin/components/AdminSidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function AdminSidebar() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState("");
  const [adminRole, setAdminRole] = useState("");

  useEffect(() => {
    const storedAdmin = localStorage.getItem("adminData");
    if (storedAdmin) {
      const admin = JSON.parse(storedAdmin);
      setAdminName(admin.fullName || "Admin");
      setAdminRole(admin.role || "admin");
    }
  }, []);

  const navItems = [
    { label: "Dashboard", icon: "📊", path: "/admin/dashboard" },
    { label: "Owners", icon: "👥", path: "/admin/owners" },
    { label: "Fields", icon: "🏟️", path: "/admin/fields" },
    { label: "Bookings", icon: "📅", path: "/admin/bookings" },
    { label: "Financial", icon: "💰", path: "/admin/financial" },
    { label: "CMS", icon: "📝", path: "/admin/cms" },
    { label: "Notifications", icon: "🔔", path: "/admin/notifications" },
    { label: "Settings", icon: "⚙️", path: "/admin/settings" },
    { label: "Activity Logs", icon: "📋", path: "/admin/activity" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/admin/login");
  };

  const roleLabels = {
    super_admin: "Super Admin",
    admin: "Admin",
    support: "Support",
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-logo">
        <div className="admin-logo-badge">SL</div>
        <div className="admin-logo-text">
          <span className="admin-logo-title">Sport Lebanon</span>
          <span className="admin-logo-subtitle">Admin Panel</span>
        </div>
      </div>

      <div className="admin-nav">
        <span className="admin-nav-section-title">Management</span>

        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              "admin-nav-item " + (isActive ? "admin-nav-item-active" : "")
            }
          >
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="admin-user-box">
        <div className="admin-user-avatar">
          {adminName.charAt(0).toUpperCase()}
        </div>
        <div className="admin-user-info">
          <div className="admin-user-name">{adminName}</div>
          <div className="admin-user-role">{roleLabels[adminRole] || adminRole}</div>
        </div>
      </div>

      <button onClick={handleLogout} className="admin-logout-btn">
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </aside>
  );
}

export default AdminSidebar;

