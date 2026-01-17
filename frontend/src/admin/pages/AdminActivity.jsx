// src/admin/pages/AdminActivity.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";


function AdminActivity() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (entityType) params.set("entityType", entityType);
      params.set("page", page.toString());
      params.set("limit", "30");

      const res = await fetch(`${API_BASE}/api/admin/activity?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          navigate("/admin/login");
          return;
        }
        throw new Error("Failed to fetch activity logs");
      }

      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error("Fetch logs error:", err);
    } finally {
      setLoading(false);
    }
  }, [entityType, page, navigate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionColor = (action) => {
    if (action.includes("approve") || action.includes("reactivate")) return "#22c55e";
    if (action.includes("reject") || action.includes("suspend") || action.includes("block")) return "#ef4444";
    if (action.includes("update") || action.includes("edit")) return "#3b82f6";
    return "#64748b";
  };

  return (
    <div>
      <div className="admin-card">
        {/* Filters */}
        <div className="admin-filters">
          <select
            className="admin-filter-select"
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Entity Types</option>
            <option value="owner">Owner</option>
            <option value="field">Field</option>
            <option value="booking">Booking</option>
            <option value="settings">Settings</option>
            <option value="notification">Notification</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="admin-empty">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📋</div>
            <div className="admin-empty-title">No activity logs found</div>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {log.adminId?.fullName || "System"}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {log.adminId?.role || ""}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            color: getActionColor(log.action),
                            fontWeight: 500,
                          }}
                        >
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        <span className="admin-badge">{log.entityType}</span>
                      </td>
                      <td style={{ maxWidth: 300 }}>
                        {log.before && log.after ? (
                          <div style={{ fontSize: 12 }}>
                            <span style={{ color: "#ef4444" }}>
                              {log.before.status || JSON.stringify(log.before).slice(0, 30)}
                            </span>
                            {" → "}
                            <span style={{ color: "#22c55e" }}>
                              {log.after.status || JSON.stringify(log.after).slice(0, 30)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="admin-pagination">
              <button
                className="admin-pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span className="admin-pagination-info">
                Page {page} of {pagination.pages} ({pagination.total} total)
              </span>
              <button
                className="admin-pagination-btn"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminActivity;

