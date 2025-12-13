// src/dashboard/pages/OwnerBookings.jsx
import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import "../dashboard.css";

function OwnerBookings() {
  const location = useLocation();
  
  const [ownerName, setOwnerName] = useState("");
  const [ownerId, setOwnerId] = useState("");

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, confirmed, pending, cancelled
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const storedName = localStorage.getItem("ownerName");
    const storedId = localStorage.getItem("ownerId");

    if (storedName) setOwnerName(storedName);
    if (storedId) setOwnerId(storedId);
  }, []);

  const fetchBookings = useCallback(async () => {
    if (!ownerId) return;
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({ ownerId });
      if (filter !== "all") queryParams.append("status", filter);

      const res = await fetch(
        `http://localhost:5000/api/owner/bookings?${queryParams}`
      );
      const data = await res.json();
      if (res.ok) setBookings(data.bookings || []);
    } finally {
      setLoading(false);
    }
  }, [ownerId, filter]);

  // Fetch bookings on mount, filter change, and when navigating back
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings, location.key]);

  const getToken = () => {
    return localStorage.getItem("ownerToken") || "";
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    if (!confirm(`Are you sure you want to ${newStatus === "cancelled" ? "cancel" : "mark as completed"} this booking?`)) {
      return;
    }

    try {
      const token = getToken();
      const res = await fetch(
        `http://localhost:5000/api/owner/bookings/${bookingId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ownerId,
            status: newStatus,
          }),
        }
      );

      if (res.ok) {
        fetchBookings();
        setSelectedBooking(null);
      } else {
        const error = await res.json();
        alert(error.message || "Failed to update booking");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Error updating booking");
    }
  };

  return (
    <>
      <DashboardHeader ownerName={ownerName} />

      <div style={{ padding: 0 }}>
        {/* Filters */}
        <div className="dashboard-panel" style={{ marginBottom: 24 }}>
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Bookings</h2>
              <p className="dashboard-panel-subtitle">Manage all bookings for your fields</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {["all", "confirmed", "pending", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className="dashboard-date-pill"
                style={{
                  background: filter === status ? "#22c55e" : "white",
                  color: filter === status ? "white" : "#475569",
                  borderColor: filter === status ? "#22c55e" : "#e2e8f0",
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="dashboard-panel">
            <p className="dashboard-loading">Loading bookings…</p>
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div className="dashboard-panel">
            <p className="dashboard-empty">No bookings found.</p>
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="dashboard-panel">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Field</th>
                  <th>Customer</th>
                  <th>Date & Time</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <code style={{ fontSize: 11, color: "#64748b" }}>
                        {b.bookingCode}
                      </code>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>
                          {b.fieldName}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {b.fieldSport}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 500 }}>{b.customerName}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {b.customerEmail}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{b.dateFormatted}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {b.timeRange}
                      </div>
                    </td>
                    <td>{b.duration}h</td>
                    <td style={{ fontWeight: 600 }}>
                      ${b.totalPrice.toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={
                          "badge " +
                          (b.status === "confirmed"
                            ? "badge-success"
                            : b.status === "pending"
                            ? "badge-warning"
                            : "badge-danger")
                        }
                      >
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="dashboard-date-pill"
                          style={{ fontSize: 11, padding: "4px 8px" }}
                        >
                          View
                        </button>
                        {b.status === "pending" && (
                          <button
                            onClick={() => handleStatusUpdate(b._id, "confirmed")}
                            className="dashboard-date-pill"
                            style={{
                              fontSize: 11,
                              padding: "4px 8px",
                              background: "#22c55e",
                              color: "white",
                              borderColor: "#22c55e",
                            }}
                          >
                            Complete
                          </button>
                        )}
                        {b.status === "confirmed" && (
                          <button
                            onClick={() => handleStatusUpdate(b._id, "cancelled")}
                            className="dashboard-date-pill"
                            style={{
                              fontSize: 11,
                              padding: "4px 8px",
                              background: "#ef4444",
                              color: "white",
                              borderColor: "#ef4444",
                            }}
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
        )}

        {/* Booking Details Modal */}
        {selectedBooking && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setSelectedBooking(null)}
          >
            <div
              className="dashboard-panel"
              style={{
                maxWidth: 600,
                width: "90%",
                maxHeight: "90vh",
                overflow: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dashboard-panel-header">
                <div>
                  <h2 className="dashboard-panel-title">Booking Details</h2>
                  <p className="dashboard-panel-subtitle">
                    Booking ID: {selectedBooking.bookingCode}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 24,
                    cursor: "pointer",
                    color: "#64748b",
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                    Field
                  </label>
                  <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500 }}>
                    {selectedBooking.fieldName} ({selectedBooking.fieldSport})
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                    Customer
                  </label>
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {selectedBooking.customerName}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      {selectedBooking.customerEmail}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      {selectedBooking.customerPhone}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                    Date & Time
                  </label>
                  <div style={{ marginTop: 4, fontSize: 14 }}>
                    {selectedBooking.dateFormatted}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    {selectedBooking.timeRange}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                      Duration
                    </label>
                    <div style={{ marginTop: 4, fontSize: 14 }}>
                      {selectedBooking.duration} hours
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                      Total Price
                    </label>
                    <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600 }}>
                      ${selectedBooking.totalPrice.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                    Status
                  </label>
                  <div style={{ marginTop: 4 }}>
                    <span
                      className={
                        "badge " +
                        (selectedBooking.status === "confirmed"
                          ? "badge-success"
                          : selectedBooking.status === "pending"
                          ? "badge-warning"
                          : "badge-danger")
                      }
                    >
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  {selectedBooking.status === "pending" && (
                    <button
                      onClick={() => handleStatusUpdate(selectedBooking._id, "confirmed")}
                      className="dashboard-primary-btn"
                      style={{ flex: 1 }}
                    >
                      Mark as Completed
                    </button>
                  )}
                  {selectedBooking.status === "confirmed" && (
                    <button
                      onClick={() => handleStatusUpdate(selectedBooking._id, "cancelled")}
                      style={{
                        flex: 1,
                        padding: "10px 20px",
                        borderRadius: "10px",
                        border: "1px solid #ef4444",
                        background: "white",
                        color: "#ef4444",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default OwnerBookings;

