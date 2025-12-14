// src/admin/pages/AdminDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentOwners, setRecentOwners] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        "http://localhost:5000/api/admin/dashboard/overview",
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("adminToken");
          navigate("/admin/login");
          return;
        }
        throw new Error("Failed to fetch dashboard");
      }

      const data = await res.json();
      setStats(data.stats);
      setRecentBookings(data.recentBookings || []);
      setRecentOwners(data.recentOwners || []);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="admin-empty">
        <div className="admin-empty-icon">⏳</div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Fields", value: stats?.totalFields || 0, icon: "🏟️" },
    { label: "Total Owners", value: stats?.totalOwners || 0, icon: "👥" },
    { label: "Total Bookings", value: stats?.totalBookings || 0, icon: "📅" },
    {
      label: "Platform Revenue",
      value: `$${(stats?.totalCommission || 0).toLocaleString()}`,
      icon: "💰",
    },
  ];

  const pendingCards = [
    {
      label: "Pending Owners",
      value: stats?.pendingOwners || 0,
      action: () => navigate("/admin/owners?status=pending"),
    },
    {
      label: "Pending Fields",
      value: stats?.pendingFields || 0,
      action: () => navigate("/admin/fields?approvalStatus=pending"),
    },
    {
      label: "Completed Bookings",
      value: stats?.completedBookings || 0,
      action: () => navigate("/admin/bookings?status=completed"),
    },
    {
      label: "Total Revenue",
      value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
      action: () => navigate("/admin/financial"),
    },
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {statCards.map((card) => (
          <div key={card.label} className="admin-stat-card">
            <span style={{ fontSize: 24 }}>{card.icon}</span>
            <span className="admin-stat-label">{card.label}</span>
            <span className="admin-stat-value">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Pending Approvals */}
      <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
        {pendingCards.map((card) => (
          <div
            key={card.label}
            className="admin-stat-card"
            style={{ cursor: "pointer" }}
            onClick={card.action}
          >
            <span className="admin-stat-label">{card.label}</span>
            <span className="admin-stat-value">{card.value}</span>
            <span
              style={{
                fontSize: 12,
                color: "#3b82f6",
                fontWeight: 500,
              }}
            >
              View →
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Recent Bookings */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Recent Bookings</h3>
            <button
              className="admin-btn admin-btn-outline admin-btn-sm"
              onClick={() => navigate("/admin/bookings")}
            >
              View All
            </button>
          </div>
          {recentBookings.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 14 }}>No recent bookings</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>User</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => (
                    <tr key={b._id}>
                      <td>{b.fieldName}</td>
                      <td>{b.userName}</td>
                      <td>
                        <span className={`admin-badge ${b.status}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Owners */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Recent Owner Applications</h3>
            <button
              className="admin-btn admin-btn-outline admin-btn-sm"
              onClick={() => navigate("/admin/owners")}
            >
              View All
            </button>
          </div>
          {recentOwners.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 14 }}>No recent applications</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOwners.map((o) => (
                    <tr key={o._id}>
                      <td>{o.fullName}</td>
                      <td>{o.email}</td>
                      <td>
                        <span className={`admin-badge ${o.status}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

