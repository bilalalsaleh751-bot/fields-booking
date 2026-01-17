// src/admin/pages/AdminBookings.jsx
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";


function AdminBookings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
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

  const fetchBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(
        `${API_BASE}/api/admin/bookings?${params}`,
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
        throw new Error("Failed to fetch bookings");
      }

      const data = await res.json();
      setBookings(data.bookings || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error("Fetch bookings error:", err);
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [status, search, page, navigate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusChange = async (bookingId, newStatus, reason = "") => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${API_BASE}/api/admin/bookings/${bookingId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus, reason }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Action failed");
      }

      showToast("success", data.message);
      
      // IMMEDIATELY update local state with the returned booking data
      if (data.booking) {
        setBookings(prevBookings => 
          prevBookings.map(b => b._id === bookingId ? { ...b, ...data.booking } : b)
        );
      } else {
        fetchBookings();
      }
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async (bookingId) => {
    const resolution = prompt("Enter dispute resolution:");
    if (!resolution) return;

    const newStatus = confirm("Refund the booking? (OK = Cancel + Refund, Cancel = Keep as is)") 
      ? "cancelled" 
      : "confirmed";

    setActionLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${API_BASE}/api/admin/bookings/${bookingId}/dispute`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ resolution, newStatus }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Action failed");
      }

      showToast("success", data.message);
      
      // IMMEDIATELY update local state with the returned booking data
      if (data.booking) {
        setBookings(prevBookings => 
          prevBookings.map(b => b._id === bookingId ? { ...b, ...data.booking } : b)
        );
      } else {
        fetchBookings();
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
            placeholder="Search by user name/email..."
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
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="admin-empty">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📅</div>
            <div className="admin-empty-title">No bookings found</div>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>User</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td style={{ fontWeight: 500 }}>{booking.field?.name || "—"}</td>
                      <td>
                        <div>{booking.userName}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {booking.userEmail}
                        </div>
                      </td>
                      <td>{booking.date}</td>
                      <td>
                        {booking.startTime} - {booking.endTime}
                      </td>
                      <td>${booking.totalPrice}</td>
                      <td>
                        <span className={`admin-badge ${booking.status}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${booking.paymentStatus || "unpaid"}`}>
                          {booking.paymentStatus || "unpaid"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          {booking.status === "disputed" && (
                            <button
                              className="admin-btn admin-btn-primary admin-btn-sm"
                              onClick={() => handleDispute(booking._id)}
                              disabled={actionLoading}
                            >
                              Resolve
                            </button>
                          )}
                          {booking.status === "pending" && (
                            <button
                              className="admin-btn admin-btn-success admin-btn-sm"
                              onClick={() => handleStatusChange(booking._id, "confirmed")}
                              disabled={actionLoading}
                            >
                              Confirm
                            </button>
                          )}
                          {(booking.status === "pending" || booking.status === "confirmed") && (
                            <button
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              onClick={() => handleStatusChange(booking._id, "cancelled")}
                              disabled={actionLoading}
                            >
                              Cancel
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

export default AdminBookings;

