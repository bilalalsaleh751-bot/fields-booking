// src/admin/pages/AdminFields.jsx
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";


function AdminFields() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [fields, setFields] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const approvalStatus = searchParams.get("approvalStatus") || "";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFields = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (approvalStatus) params.set("approvalStatus", approvalStatus);
      if (search) params.set("search", search);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(
        `${API_BASE}/api/admin/fields?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          navigate("/admin/login");
          return;
        }
        throw new Error("Failed to fetch fields");
      }

      const data = await res.json();
      setFields(data.fields || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error("Fetch fields error:", err);
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [approvalStatus, search, page, navigate]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const handleAction = async (fieldId, action, reason = "") => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${API_BASE}/api/admin/fields/${fieldId}/${action}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Action failed");
      }

      showToast("success", data.message);
      
      // IMMEDIATELY update local state with the returned field data
      // This eliminates the need for a full refetch and provides instant UI feedback
      if (data.field) {
        setFields(prevFields => 
          prevFields.map(f => f._id === fieldId ? { ...f, ...data.field } : f)
        );
      } else {
        // Fallback: refetch if no field data returned
        fetchFields();
      }
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const updateFilters = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  return (
    <div>
      {toast && (
        <div className={`admin-toast ${toast.type}`}>{toast.message}</div>
      )}

      <div className="admin-card">
        {/* Filters */}
        <div className="admin-filters">
          <input
            type="text"
            placeholder="Search fields..."
            className="admin-filter-input"
            value={search}
            onChange={(e) => updateFilters("search", e.target.value)}
          />
          <select
            className="admin-filter-select"
            value={approvalStatus}
            onChange={(e) => updateFilters("approvalStatus", e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="disabled">Disabled</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="admin-empty">Loading...</div>
        ) : fields.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">🏟️</div>
            <div className="admin-empty-title">No fields found</div>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Owner</th>
                    <th>City</th>
                    <th>Price/hr</th>
                    <th>Status</th>
                    <th>Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr key={field._id}>
                      <td style={{ fontWeight: 500 }}>{field.name}</td>
                      <td>{field.owner?.fullName || "—"}</td>
                      <td>{field.city || "—"}</td>
                      <td>${field.pricePerHour}</td>
                      <td>
                        <span className={`admin-badge ${field.approvalStatus}`}>
                          {field.approvalStatus}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            color: field.isActive ? "#22c55e" : "#ef4444",
                            fontWeight: 500,
                          }}
                        >
                          {field.isActive ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          {field.approvalStatus === "pending" && (
                            <>
                              <button
                                className="admin-btn admin-btn-success admin-btn-sm"
                                onClick={() => handleAction(field._id, "approve")}
                                disabled={actionLoading}
                              >
                                Approve
                              </button>
                              <button
                                className="admin-btn admin-btn-danger admin-btn-sm"
                                onClick={() => {
                                  const reason = prompt("Rejection reason:");
                                  if (reason) handleAction(field._id, "reject", reason);
                                }}
                                disabled={actionLoading}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {field.approvalStatus === "approved" && (
                            <>
                              <button
                                className="admin-btn admin-btn-outline admin-btn-sm"
                                onClick={() => handleAction(field._id, "disable")}
                                disabled={actionLoading}
                              >
                                Disable
                              </button>
                              <button
                                className="admin-btn admin-btn-danger admin-btn-sm"
                                onClick={() => {
                                  const reason = prompt("Block reason (rule violation):");
                                  if (reason) handleAction(field._id, "block", reason);
                                }}
                                disabled={actionLoading}
                              >
                                Block
                              </button>
                            </>
                          )}
                          {(field.approvalStatus === "disabled" || field.approvalStatus === "blocked") && (
                            <button
                              className="admin-btn admin-btn-primary admin-btn-sm"
                              onClick={() => handleAction(field._id, "approve")}
                              disabled={actionLoading}
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
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
                onClick={() => updateFilters("page", (page - 1).toString())}
              >
                Previous
              </button>
              <span className="admin-pagination-info">
                Page {page} of {pagination.pages} ({pagination.total} total)
              </span>
              <button
                className="admin-pagination-btn"
                disabled={page >= pagination.pages}
                onClick={() => updateFilters("page", (page + 1).toString())}
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

export default AdminFields;

