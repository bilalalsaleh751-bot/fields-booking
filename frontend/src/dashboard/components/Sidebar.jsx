// src/dashboard/components/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";

function Sidebar() {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();
  const [ownerName, setOwnerName] = useState("");

  useEffect(() => {
    // Use auth context first, fallback to localStorage
    if (auth?.name) {
      setOwnerName(auth.name);
    } else {
      const storedName = localStorage.getItem("ownerName");
      if (storedName) setOwnerName(storedName);
    }
  }, [auth]);

  const navItems = [
    { label: "Dashboard", icon: "📊", path: "/owner/dashboard" },
    { label: "Fields", icon: "🏟️", path: "/owner/fields" },
    { label: "Bookings", icon: "📅", path: "/owner/bookings" },
    { label: "Financial", icon: "💰", path: "/owner/financial" },
    { label: "Reviews", icon: "⭐", path: "/owner/reviews" },
    { label: "Settings", icon: "⚙️", path: "/owner/settings" },
  ];

  const handleLogout = useCallback(() => {
    // Clear ALL session tokens to prevent any session conflicts
    // Owner tokens
    localStorage.removeItem("ownerToken");
    localStorage.removeItem("ownerId");
    localStorage.removeItem("ownerName");
    
    // User tokens (prevent auto-login as user after owner logout)
    localStorage.removeItem("userToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    
    // Admin tokens
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminData");
    
    // Clear auth role
    localStorage.removeItem("authRole");
    
    // Use AuthContext's full logout to clear auth state completely
    logout();
    
    // Navigate to OWNER login page
    navigate("/owner/login", { replace: true });
  }, [logout, navigate]);

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-logo">
        <div className="dashboard-logo-badge">SL</div>
        <div className="dashboard-logo-text">
          <span className="dashboard-logo-title">Sport Lebanon</span>
          <span className="dashboard-logo-subtitle">Field Owner Panel</span>
        </div>
      </div>

      <div className="dashboard-nav">
        <span className="dashboard-nav-section-title">Overview</span>

        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              "dashboard-nav-item " +
              (isActive ? "dashboard-nav-item-active" : "")
            }
          >
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="dashboard-owner-box">
        <div className="dashboard-owner-avatar" />
        <div className="dashboard-owner-info">
          <div className="dashboard-owner-name">{ownerName || "Owner"}</div>
          <div className="dashboard-owner-role">Field Owner</div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "calc(100% - 32px)",
          margin: "16px 16px",
          padding: "12px 16px",
          borderRadius: 10,
          border: "1px solid #fecaca",
          background: "#fef2f2",
          color: "#dc2626",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </aside>
  );
}

export default Sidebar;
