// src/dashboard/components/StatsGrid.jsx
import { useNavigate } from "react-router-dom";

function StatsGrid({ stats }) {
  const navigate = useNavigate();

  if (!stats) {
    return (
      <section className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-title">Loading...</div>
          <div className="dashboard-card-value">—</div>
          <div className="dashboard-card-chip">...</div>
        </div>
      </section>
    );
  }

  const items = [
    {
      label: "Total Bookings",
      value: stats.totalBookings ?? 0,
      chip: "All time",
      link: "/owner/bookings",
    },
    {
      label: "Upcoming Today",
      value: stats.upcomingToday ?? 0,
      chip: stats.upcomingToday > 0 ? "Today" : "No bookings",
      link: "/owner/bookings",
    },
    {
      label: "Earnings (This Month)",
      value: `$${(stats.earningsThisMonth ?? 0).toLocaleString()}`,
      chip: "Gross revenue",
      link: "/owner/financial",
    },
    {
      label: "Active Fields",
      value: stats.activeFields ?? 0,
      chip: stats.activeFields > 0 ? "Active" : "No active fields",
      link: "/owner/fields",
    },
  ];

  return (
    <section className="dashboard-grid">
      {items.map((item) => (
        <div 
          key={item.label} 
          className="dashboard-card"
          onClick={() => navigate(item.link)}
          style={{ cursor: "pointer" }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate(item.link)}
        >
          <div className="dashboard-card-title">
            <span>{item.label}</span>
          </div>
          <div className="dashboard-card-value">{item.value}</div>
          <div className="dashboard-card-chip">{item.chip}</div>
        </div>
      ))}
    </section>
  );
}

export default StatsGrid;
