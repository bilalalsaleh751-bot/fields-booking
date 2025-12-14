// src/dashboard/components/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Sidebar() {
  const navigate = useNavigate();
  const [ownerName, setOwnerName] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("ownerName");
    if (storedName) setOwnerName(storedName);
  }, []);

  const navItems = [
    { label: "Dashboard", icon: "📊", path: "/owner/dashboard" },
    { label: "Fields", icon: "🏟️", path: "/owner/fields" },
    { label: "Bookings", icon: "📅", path: "/owner/bookings" },
    { label: "Financial", icon: "💰", path: "/owner/financial" },
    { label: "Reviews", icon: "⭐", path: "/owner/reviews" },
    { label: "Settings", icon: "⚙️", path: "/owner/settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("ownerToken");
    localStorage.removeItem("ownerName");
    localStorage.removeItem("ownerId");
    navigate("/");
  };

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
