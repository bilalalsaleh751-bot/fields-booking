// src/dashboard/components/Sidebar.jsx
import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

function Sidebar() {
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
    </aside>
  );
}

export default Sidebar;
