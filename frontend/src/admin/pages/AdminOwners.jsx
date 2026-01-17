// src/admin/pages/AdminOwners.jsx
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";


function AdminOwners() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [owners, setOwners] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOwners = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(
        `${API_BASE}/api/admin/owners?${params}`,
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
        throw new Error("Failed to fetch owners");
      }

      const data = await res.json();
      setOwners(data.owners || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error("Fetch owners error:", err);
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [status, search, page, navigate]);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  const handleAction = async (ownerId, action, reason = "") => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${API_BASE}/api/admin/owners/${ownerId}/${action}`,
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
      
      // IMMEDIATELY update local state with the returned owner data
      // This eliminates the need for a full refetch and provides instant UI feedback
      if (data.owner) {
        setOwners(prevOwners => 
          prevOwners.map(o => o._id === ownerId ? { ...o, ...data.owner } : o)
        );
      } else {
        // Fallback: refetch if no owner data returned
        fetchOwners();
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
            placeholder="Search owners..."
            className="admin-filter-input"
            value={search}
            onChange={(e) => updateFilters("search", e.target.value)}
          />
          <select
            className="admin-filter-select"
            value={status}
            onChange={(e) => updateFilters("status", e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="admin-empty">Loading...</div>
        ) : owners.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">👥</div>
            <div className="admin-empty-title">No owners found</div>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Business</th>
                    <th>City</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {owners.map((owner) => (
                    <tr key={owner._id}>
                      <td style={{ fontWeight: 500 }}>{owner.fullName}</td>
                      <td>{owner.email}</td>
                      <td>{owner.businessName || "—"}</td>
                      <td>{owner.city || "—"}</td>
                      <td>
                        <span className={`admin-badge ${owner.status}`}>
                          {owner.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        {new Date(owner.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="admin-actions">
                          {(owner.status === "pending_review" || owner.status === "pending") && (
                            <>
                              <button
                                className="admin-btn admin-btn-success admin-btn-sm"
                                onClick={() => handleAction(owner._id, "approve")}
                                disabled={actionLoading}
                              >
                                Approve
                              </button>
                              <button
                                className="admin-btn admin-btn-danger admin-btn-sm"
                                onClick={() => {
                                  const reason = prompt("Rejection reason:");
                                  if (reason) handleAction(owner._id, "reject", reason);
                                }}
                                disabled={actionLoading}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {owner.status === "approved" && (
                            <button
                              className="admin-btn admin-btn-outline admin-btn-sm"
                              onClick={() => {
                                const reason = prompt("Suspension reason:");
                                if (reason) handleAction(owner._id, "suspend", reason);
                              }}
                              disabled={actionLoading}
                            >
                              Suspend
                            </button>
                          )}
                          {owner.status === "suspended" && (
                            <button
                              className="admin-btn admin-btn-primary admin-btn-sm"
                              onClick={() => handleAction(owner._id, "reactivate")}
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

export default AdminOwners;

