import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import "./AccountPages.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";


// Status labels with Arabic translations
const STATUS_LABELS = {
  pending: { en: "Pending", ar: "قيد الانتظار", color: "#f59e0b" },
  confirmed: { en: "Confirmed", ar: "مؤكد", color: "#3b82f6" },
  completed: { en: "Completed", ar: "مكتمل", color: "#22c55e" },
  cancelled: { en: "Cancelled", ar: "ملغي", color: "#ef4444" },
};

export default function AccountBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const pollIntervalRef = useRef(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBookings = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(
        `${API_BASE}/api/users/bookings?type=${activeTab}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store" // Prevent caching
        }
      );

      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Fetch bookings error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Initial fetch and polling setup
  useEffect(() => {
    fetchBookings(true);

    // Set up polling every 25 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchBookings(false);
    }, 25000);

    // Cleanup on unmount or tab change
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [activeTab, fetchBookings]);

  // Refetch when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchBookings(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchBookings]);

  const handleCancel = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setActionLoading(bookingId);
    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(
        `${API_BASE}/api/users/bookings/${bookingId}/cancel`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      if (res.ok) {
        showToast("success", "Booking cancelled successfully");
        // Immediate update
        setBookings((prev) =>
          prev.map((b) =>
            b._id === bookingId ? { ...b, status: "cancelled" } : b
          )
        );
        // Also refetch to ensure consistency
        fetchBookings(false);
      } else {
        showToast("error", data.message || "Failed to cancel booking");
      }
    } catch (err) {
      showToast("error", "Server error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewModal) return;

    setActionLoading(reviewModal._id);
    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(
        `${API_BASE}/api/users/bookings/${reviewModal._id}/review`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reviewForm),
        }
      );

      const data = await res.json();

      if (res.ok) {
        showToast("success", "Review submitted successfully");
        setReviewModal(null);
        setReviewForm({ rating: 5, comment: "" });
        fetchBookings(false);
      } else {
        showToast("error", data.message || "Failed to submit review");
      }
    } catch (err) {
      showToast("error", "Server error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const downloadReceipt = async (bookingId) => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(
        `${API_BASE}/api/users/bookings/${bookingId}/receipt`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        const data = await res.json();
        const receiptWindow = window.open("", "_blank");
        receiptWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Receipt - ${data.receipt.receiptNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
              h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              .section h3 { color: #475569; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; }
              .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
              .label { color: #64748b; }
              .value { color: #0f172a; font-weight: 500; }
              .total { font-size: 24px; color: #1e3a8a; text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #e2e8f0; }
              .footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 12px; }
              @media print { body { padding: 20px; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Sport Lebanon</h1>
              <p>Booking Receipt</p>
            </div>
            <div class="section">
              <h3>Receipt Details</h3>
              <div class="row"><span class="label">Receipt #:</span><span class="value">${data.receipt.receiptNumber}</span></div>
              <div class="row"><span class="label">Date:</span><span class="value">${new Date(data.receipt.createdAt).toLocaleDateString()}</span></div>
              <div class="row"><span class="label">Status:</span><span class="value">${data.receipt.status}</span></div>
            </div>
            <div class="section">
              <h3>Booking Details</h3>
              <div class="row"><span class="label">Field:</span><span class="value">${data.receipt.field.name}</span></div>
              <div class="row"><span class="label">Location:</span><span class="value">${data.receipt.field.address}</span></div>
              <div class="row"><span class="label">Date:</span><span class="value">${data.receipt.date}</span></div>
              <div class="row"><span class="label">Time:</span><span class="value">${data.receipt.time}</span></div>
              <div class="row"><span class="label">Duration:</span><span class="value">${data.receipt.duration} hour(s)</span></div>
            </div>
            <div class="section">
              <h3>Customer</h3>
              <div class="row"><span class="label">Name:</span><span class="value">${data.receipt.customer.name}</span></div>
              <div class="row"><span class="label">Email:</span><span class="value">${data.receipt.customer.email}</span></div>
              <div class="row"><span class="label">Phone:</span><span class="value">${data.receipt.customer.phone}</span></div>
            </div>
            <div class="total">
              Total: $${data.receipt.payment.total}
            </div>
            <div class="footer">
              <p>Thank you for booking with Sport Lebanon!</p>
              <p>Questions? Contact support@sportlebanon.com</p>
            </div>
          </body>
          </html>
        `);
        receiptWindow.document.close();
        receiptWindow.print();
      }
    } catch (err) {
      showToast("error", "Failed to generate receipt");
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.pending;
    return (
      <span
        className={`status-badge ${status}`}
        style={{ backgroundColor: `${statusInfo.color}15`, color: statusInfo.color, borderColor: statusInfo.color }}
      >
        {statusInfo.en} / {statusInfo.ar}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="account-loading">
        <div className="spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="account-page">
      {toast && <div className={`account-toast ${toast.type}`}>{toast.message}</div>}

      <div className="account-page-header">
        <h1>My Bookings</h1>
        <p>View and manage your court bookings</p>
      </div>

      {/* Tabs */}
      <div className="account-tabs">
        <button
          className={`account-tab ${activeTab === "upcoming" ? "active" : ""}`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`account-tab ${activeTab === "past" ? "active" : ""}`}
          onClick={() => setActiveTab("past")}
        >
          Past
        </button>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="account-empty">
          <span className="empty-icon">📅</span>
          <h3>No {activeTab} bookings</h3>
          <p>
            {activeTab === "upcoming"
              ? "You don't have any upcoming bookings yet."
              : "You haven't completed any bookings yet."}
          </p>
          {activeTab === "upcoming" && (
            <Link to="/discover" className="account-cta-btn">
              Book a Court
            </Link>
          )}
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking._id} className="booking-card">
              <div className="booking-image">
                {booking.field?.mainImage || booking.field?.images?.[0] ? (
                  <img
                    src={`${API_BASE}/${booking.field.mainImage || booking.field.images[0]}`}
                    alt={booking.field?.name}
                  />
                ) : (
                  <div className="no-image">🏟️</div>
                )}
              </div>

              <div className="booking-details">
                <h3 className="booking-field-name">{booking.field?.name || "Field"}</h3>
                <p className="booking-location">
                  📍 {booking.field?.city}, {booking.field?.area}
                </p>

                <div className="booking-info">
                  <div className="info-item">
                    <span className="info-label">Date</span>
                    <span className="info-value">{formatDate(booking.date)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Time</span>
                    <span className="info-value">
                      {booking.startTime} - {booking.endTime}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Duration</span>
                    <span className="info-value">{booking.duration}h</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Total</span>
                    <span className="info-value price">${booking.totalPrice}</span>
                  </div>
                </div>

                <div className="booking-status">
                  {getStatusBadge(booking.status)}
                  {booking.review?.rating && (
                    <span className="reviewed-badge">⭐ Reviewed</span>
                  )}
                </div>
              </div>

              <div className="booking-actions">
                {activeTab === "upcoming" && booking.status !== "cancelled" && booking.status !== "completed" && (
                  <button
                    className="action-btn cancel"
                    onClick={() => handleCancel(booking._id)}
                    disabled={actionLoading === booking._id}
                  >
                    {actionLoading === booking._id ? "..." : "Cancel"}
                  </button>
                )}

                {activeTab === "past" && (
                  <>
                    <button
                      className="action-btn secondary"
                      onClick={() => downloadReceipt(booking._id)}
                    >
                      Receipt
                    </button>

                    {!booking.review?.rating && booking.status === "completed" && (
                      <button
                        className="action-btn primary"
                        onClick={() => setReviewModal(booking)}
                      >
                        Review
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Review Your Experience</h3>
            <p className="modal-subtitle">{reviewModal.field?.name}</p>

            <div className="rating-input">
              <label>Rating</label>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={`star ${star <= reviewForm.rating ? "active" : ""}`}
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="comment-input">
              <label>Comment (optional)</label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="Share your experience..."
                rows={4}
              />
            </div>

            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setReviewModal(null)}>
                Cancel
              </button>
              <button
                className="modal-btn submit"
                onClick={handleReviewSubmit}
                disabled={actionLoading === reviewModal._id}
              >
                {actionLoading === reviewModal._id ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
