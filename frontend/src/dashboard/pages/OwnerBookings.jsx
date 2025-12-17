// src/dashboard/pages/OwnerBookings.jsx
// PDR 2.4 - Booking Management (Step 2: Actions)
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import "../dashboard.css";

function OwnerBookings() {
  const location = useLocation();
  const abortControllerRef = useRef(null);

  const [ownerName, setOwnerName] = useState("");
  const [ownerId, setOwnerId] = useState("");

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming"); // upcoming, pending, past, cancelled
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Force re-render every minute to update button visibility based on time
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Get owner info directly from localStorage (path-based auth)
  // Each tab loads its own session data independently
  useEffect(() => {
    const storedToken = localStorage.getItem("ownerToken");
    const storedName = localStorage.getItem("ownerName");
    const storedId = localStorage.getItem("ownerId");

    if (!storedToken) {
      console.warn("No owner token found");
      return;
    }

    if (storedName) setOwnerName(storedName);
    if (storedId) setOwnerId(storedId);
  }, []);

  const fetchBookings = useCallback(async () => {
    if (!ownerId) return;
    
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({ ownerId });

      const res = await fetch(
        `http://localhost:5000/api/owner/bookings?${queryParams}`,
        { 
          cache: "no-store",
          signal: abortControllerRef.current.signal
        }
      );
      const data = await res.json();
      if (res.ok) setBookings(data.bookings || []);
    } catch (err) {
      // Don't show error if request was aborted
      if (err.name === "AbortError") return;
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);
  
  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch bookings on mount and when navigating back
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings, location.key]);

  // Poll for new bookings every 60 seconds (reduced frequency for better performance)
  useEffect(() => {
    if (!ownerId) return;
    const pollInterval = setInterval(() => {
      fetchBookings();
    }, 60000);
    return () => clearInterval(pollInterval);
  }, [ownerId, fetchBookings]);

  // Filter bookings by category
  const filteredBookings = useMemo(() => {
    if (activeTab === "pending") {
      // Show only pending status bookings from upcoming category
      return bookings.filter((b) => b.status === "pending" && b.category === "upcoming");
    }
    if (activeTab === "upcoming") {
      // Show confirmed upcoming bookings (exclude pending)
      return bookings.filter((b) => b.category === "upcoming" && b.status !== "pending");
    }
    return bookings.filter((b) => b.category === activeTab);
  }, [bookings, activeTab]);

  // Count bookings by category
  const counts = useMemo(() => {
    const upcomingBookings = bookings.filter((b) => b.category === "upcoming");
    return {
      upcoming: upcomingBookings.filter((b) => b.status !== "pending").length,
      pending: upcomingBookings.filter((b) => b.status === "pending").length,
      past: bookings.filter((b) => b.category === "past").length,
      cancelled: bookings.filter((b) => b.category === "cancelled").length,
    };
  }, [bookings]);

  // ============================================================
  // FRONTEND HELPER: Check if booking can be completed
  // Rules:
  // - Status must be "confirmed" OR "pending"
  // - Booking end time must have passed
  // - NOT cancelled or already completed
  // ============================================================
  const canCompleteBooking = useCallback((booking) => {
    // Cannot complete cancelled or already completed bookings
    if (booking.status === "cancelled" || booking.status === "completed") {
      return false;
    }
    
    // Must be confirmed or pending
    if (booking.status !== "confirmed" && booking.status !== "pending") {
      return false;
    }
    
    // Check if booking end time has passed
    const now = new Date();
    
    // Get end time from booking
    let endTime = booking.endTime;
    if (!endTime && booking.startTime && booking.duration) {
      const [startH] = booking.startTime.split(":").map(Number);
      const endH = startH + Math.ceil(booking.duration);
      endTime = `${String(endH).padStart(2, "0")}:00`;
    }
    
    if (!endTime) {
      endTime = booking.startTime || "23:00";
    }
    
    const [endH, endM = "0"] = endTime.split(":").map(Number);
    
    // Parse date - handle "YYYY-MM-DD" format
    const dateStr = booking.date;
    if (!dateStr) return true; // No date, allow completion
    
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return true; // Invalid date, allow completion
    
    // Create date in local timezone (month is 0-indexed)
    const bookingEndDateTime = new Date(year, month - 1, day, endH || 0, endM || 0, 0, 0);
    
    return now >= bookingEndDateTime;
  }, []);

  // Helper: Check if booking can be cancelled
  const canCancelBooking = useCallback((booking) => {
    // Can cancel any pending or confirmed booking
    return booking.status === "pending" || booking.status === "confirmed";
  }, []);

  // Helper: Check if booking can be confirmed (pending → confirmed)
  // NOTE: This is now deprecated - we use canCompleteBooking for all completion actions
  const canConfirmBooking = useCallback((booking) => {
    // Only pending bookings that haven't started yet can be confirmed
    // For bookings that have passed, we use complete instead
    if (booking.status !== "pending") return false;
    
    // Check if booking hasn't started yet
    const now = new Date();
    const dateStr = booking.date;
    if (!dateStr) return true;
    
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return true;
    
    const [startH, startM = "0"] = (booking.startTime || "00:00").split(":").map(Number);
    const bookingStartDateTime = new Date(year, month - 1, day, startH || 0, startM || 0, 0, 0);
    
    // Can confirm only if booking hasn't started
    return now < bookingStartDateTime;
  }, []);

  // Handle booking action (complete or cancel)
  const handleBookingAction = async (bookingId, action) => {
    const actionLabel = action === "complete" ? "mark as completed" : "cancel";
    
    if (!window.confirm(`Are you sure you want to ${actionLabel} this booking?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/owner/bookings/${bookingId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("ownerToken") || ""}`,
          },
          body: JSON.stringify({ ownerId, action }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        // Update booking in state immediately
        setBookings((prev) =>
          prev.map((b) =>
            b._id === bookingId
              ? {
                  ...b,
                  status: data.booking.status,
                  paymentStatus: data.booking.paymentStatus,
                  category: data.booking.category,
                  canComplete: false,
                  canCancel: false,
                }
              : b
          )
        );
        
        // Signal dashboard to refresh on next visit
        sessionStorage.setItem("dashboardNeedsRefresh", Date.now().toString());
        
        // Close modal if open
        if (selectedBooking?._id === bookingId) {
          setSelectedBooking(null);
        }
      } else {
        alert(data.message || `Failed to ${actionLabel} booking`);
      }
    } catch (err) {
      console.error("Action error:", err);
      alert(`Error: Could not ${actionLabel} booking`);
    } finally {
      setActionLoading(false);
    }
  };

  // Format payment status for display
  const getPaymentStatusBadge = (paymentStatus) => {
    const styles = {
      paid: { background: "#dcfce7", color: "#166534" },
      pending: { background: "#fef3c7", color: "#92400e" },
      refunded: { background: "#fee2e2", color: "#991b1b" },
    };
    return (
      <span
        style={{
          padding: "4px 10px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "capitalize",
          ...(styles[paymentStatus] || styles.pending),
        }}
      >
        {paymentStatus}
      </span>
    );
  };

  // Format booking status for display
  const getStatusBadge = (status) => {
    const classMap = {
      confirmed: "badge-success",
      completed: "badge-success",
      pending: "badge-warning",
      cancelled: "badge-danger",
    };
    return (
      <span className={`badge ${classMap[status] || "badge-secondary"}`}>
        {status}
      </span>
    );
  };

  return (
    <>
      <DashboardHeader ownerName={ownerName} />

      <div style={{ padding: 0 }}>
        {/* Header with Tabs */}
        <div className="dashboard-panel" style={{ marginBottom: 24 }}>
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Bookings</h2>
              <p className="dashboard-panel-subtitle">
                Manage all bookings for your fields
              </p>
            </div>
          </div>

          {/* Category Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 20,
              borderBottom: "1px solid #e2e8f0",
              paddingBottom: 0,
            }}
          >
            {[
              { key: "upcoming", label: "Confirmed", count: counts.upcoming },
              { key: "pending", label: "Pending", count: counts.pending },
              { key: "past", label: "Past", count: counts.past },
              { key: "cancelled", label: "Cancelled", count: counts.cancelled },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 500,
                  background: "transparent",
                  border: "none",
                  borderBottom:
                    activeTab === tab.key
                      ? "2px solid #3b82f6"
                      : "2px solid transparent",
                  color: activeTab === tab.key ? "#3b82f6" : "#64748b",
                  cursor: "pointer",
                  marginBottom: -1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {tab.label}
                <span
                  style={{
                    background: activeTab === tab.key ? "#3b82f6" : "#e2e8f0",
                    color: activeTab === tab.key ? "white" : "#64748b",
                    padding: "2px 8px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="dashboard-panel">
            <p className="dashboard-loading">Loading bookings…</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBookings.length === 0 && (
          <div className="dashboard-panel" style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
            <h3 style={{ margin: 0, color: "#334155", fontWeight: 600 }}>
              No {activeTab} bookings
            </h3>
            <p style={{ color: "#64748b", marginTop: 8 }}>
              {activeTab === "upcoming"
                ? "You don't have any confirmed upcoming bookings."
                : activeTab === "pending"
                ? "No pending bookings awaiting confirmation."
                : activeTab === "past"
                ? "No past bookings to display."
                : "No cancelled bookings."}
            </p>
          </div>
        )}

        {/* Bookings Table */}
        {!loading && filteredBookings.length > 0 && (
          <div className="dashboard-panel">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Field</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <code
                        style={{
                          fontSize: 12,
                          color: "#475569",
                          background: "#f1f5f9",
                          padding: "4px 8px",
                          borderRadius: 4,
                        }}
                      >
                        #{b.bookingCode}
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
                        <div style={{ fontWeight: 500, color: "#1e293b" }}>
                          {b.customerName}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: "#1e293b" }}>
                        {b.dateFormatted}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: "#475569" }}>
                        {b.timeRange}
                      </div>
                    </td>
                    <td>
                      <span style={{ color: "#475569" }}>{b.duration}h</span>
                    </td>
                    <td>{getStatusBadge(b.status)}</td>
                    <td>{getPaymentStatusBadge(b.paymentStatus)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="dashboard-secondary-btn"
                          style={{ padding: "6px 12px", fontSize: 12 }}
                        >
                          View
                        </button>
                        
                        {/* Complete button - for confirmed/pending bookings after end time */}
                        {canCompleteBooking(b) && (
                          <button
                            onClick={() => handleBookingAction(b._id, "complete")}
                            disabled={actionLoading}
                            style={{
                              padding: "6px 12px",
                              fontSize: 12,
                              borderRadius: 8,
                              border: "none",
                              background: "#22c55e",
                              color: "white",
                              fontWeight: 500,
                              cursor: actionLoading ? "not-allowed" : "pointer",
                              opacity: actionLoading ? 0.6 : 1,
                            }}
                          >
                            Complete
                          </button>
                        )}
                        
                        {/* Confirm button - only for pending bookings that haven't started */}
                        {canConfirmBooking(b) && !canCompleteBooking(b) && (
                          <button
                            onClick={() => handleBookingAction(b._id, "confirm")}
                            disabled={actionLoading}
                            style={{
                              padding: "6px 12px",
                              fontSize: 12,
                              borderRadius: 8,
                              border: "none",
                              background: "#3b82f6",
                              color: "white",
                              fontWeight: 500,
                              cursor: actionLoading ? "not-allowed" : "pointer",
                              opacity: actionLoading ? 0.6 : 1,
                            }}
                          >
                            Confirm
                          </button>
                        )}
                        
                        {/* Cancel button - only for active bookings */}
                        {canCancelBooking(b) && (
                          <button
                            onClick={() => handleBookingAction(b._id, "cancel")}
                            disabled={actionLoading}
                            style={{
                              padding: "6px 12px",
                              fontSize: 12,
                              borderRadius: 8,
                              border: "1px solid #ef4444",
                              background: "white",
                              color: "#ef4444",
                              fontWeight: 500,
                              cursor: actionLoading ? "not-allowed" : "pointer",
                              opacity: actionLoading ? 0.6 : 1,
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
              background: "rgba(15, 23, 42, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setSelectedBooking(null)}
          >
            <div
              className="dashboard-panel"
              style={{
                maxWidth: 560,
                width: "90%",
                maxHeight: "90vh",
                overflow: "auto",
                margin: 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 24,
                  paddingBottom: 16,
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    Booking Details
                  </h2>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 13,
                      color: "#64748b",
                    }}
                  >
                    Booking #{selectedBooking.bookingCode}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    fontSize: 18,
                    cursor: "pointer",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>

              {/* Booking Status */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    padding: 16,
                    background: "#f8fafc",
                    borderRadius: 12,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}
                  >
                    Status
                  </div>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: 16,
                    background: "#f8fafc",
                    borderRadius: 12,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}
                  >
                    Payment
                  </div>
                  {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: 16,
                    background: "#f8fafc",
                    borderRadius: 12,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}
                  >
                    Total
                  </div>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 16 }}>
                    ${selectedBooking.totalPrice.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Field Info */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: 8,
                  }}
                >
                  Field
                </div>
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div
                    style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}
                  >
                    {selectedBooking.fieldName}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                    {selectedBooking.fieldSport}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: 8,
                  }}
                >
                  Customer
                </div>
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div
                    style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}
                  >
                    {selectedBooking.customerName}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      marginTop: 8,
                    }}
                  >
                    <div style={{ fontSize: 13, color: "#475569" }}>
                      📧 {selectedBooking.customerEmail}
                    </div>
                    <div style={{ fontSize: 13, color: "#475569" }}>
                      📱 {selectedBooking.customerPhone}
                    </div>
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: 8,
                  }}
                >
                  Date & Time
                </div>
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 12,
                    padding: 16,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Date</div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#0f172a",
                        marginTop: 4,
                      }}
                    >
                      {selectedBooking.dateFormatted}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Time</div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#0f172a",
                        marginTop: 4,
                      }}
                    >
                      {selectedBooking.timeRange}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Duration</div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#0f172a",
                        marginTop: 4,
                      }}
                    >
                      {selectedBooking.duration} hour
                      {selectedBooking.duration !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                {/* Complete button - primary action for bookings after end time */}
                {canCompleteBooking(selectedBooking) && (
                  <button
                    onClick={() => handleBookingAction(selectedBooking._id, "complete")}
                    disabled={actionLoading}
                    className="dashboard-primary-btn"
                    style={{
                      flex: 1,
                      background: "#22c55e",
                      opacity: actionLoading ? 0.6 : 1,
                    }}
                  >
                    {actionLoading ? "Processing..." : "Mark as Completed"}
                  </button>
                )}

                {/* Confirm button - for pending bookings that haven't started */}
                {canConfirmBooking(selectedBooking) && !canCompleteBooking(selectedBooking) && (
                  <button
                    onClick={() => handleBookingAction(selectedBooking._id, "confirm")}
                    disabled={actionLoading}
                    className="dashboard-primary-btn"
                    style={{
                      flex: 1,
                      background: "#3b82f6",
                      opacity: actionLoading ? 0.6 : 1,
                    }}
                  >
                    {actionLoading ? "Processing..." : "Confirm Booking"}
                  </button>
                )}

                {/* Cancel button */}
                {canCancelBooking(selectedBooking) && (
                  <button
                    onClick={() => handleBookingAction(selectedBooking._id, "cancel")}
                    disabled={actionLoading}
                    style={{
                      flex: 1,
                      padding: "12px 20px",
                      borderRadius: 10,
                      border: "1px solid #ef4444",
                      background: "white",
                      color: "#ef4444",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      opacity: actionLoading ? 0.6 : 1,
                    }}
                  >
                    {actionLoading ? "Processing..." : "Cancel Booking"}
                  </button>
                )}

                {/* Close button (always visible when no actions available) */}
                {!canCompleteBooking(selectedBooking) && !canCancelBooking(selectedBooking) && !canConfirmBooking(selectedBooking) && (
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="dashboard-secondary-btn"
                    style={{ flex: 1 }}
                  >
                    Close
                  </button>
                )}
              </div>

              {/* Refund notice for cancelled bookings */}
              {selectedBooking.status === "cancelled" && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    background: "#fef2f2",
                    borderRadius: 8,
                    border: "1px solid #fecaca",
                    fontSize: 13,
                    color: "#991b1b",
                    textAlign: "center",
                  }}
                >
                  This booking has been cancelled. Payment status:{" "}
                  <strong>{selectedBooking.paymentStatus}</strong>
                </div>
              )}

              {/* Completed notice */}
              {selectedBooking.status === "completed" && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    background: "#f0fdf4",
                    borderRadius: 8,
                    border: "1px solid #bbf7d0",
                    fontSize: 13,
                    color: "#166534",
                    textAlign: "center",
                  }}
                >
                  ✓ This booking has been completed successfully
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default OwnerBookings;
