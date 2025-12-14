// src/admin/components/AdminHeader.jsx
import { useLocation } from "react-router-dom";

function AdminHeader() {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("/owners")) return "Owner Management";
    if (path.includes("/fields")) return "Field Management";
    if (path.includes("/bookings")) return "Booking Management";
    if (path.includes("/financial")) return "Financial Overview";
    if (path.includes("/cms")) return "Content Management";
    if (path.includes("/notifications")) return "Notifications";
    if (path.includes("/settings")) return "Platform Settings";
    if (path.includes("/activity")) return "Activity Logs";
    return "Dashboard";
  };

  return (
    <header className="admin-header">
      <h1 className="admin-page-title">{getPageTitle()}</h1>
      <div className="admin-header-actions">
        <span className="admin-date">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>
    </header>
  );
}

export default AdminHeader;

