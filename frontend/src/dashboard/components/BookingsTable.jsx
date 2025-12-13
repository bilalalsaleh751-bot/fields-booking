// src/dashboard/components/BookingsTable.jsx
import { useNavigate } from "react-router-dom";

function BookingsTable({ bookings }) {
  const navigate = useNavigate();
  
  const handleViewAll = () => {
    navigate("/owner/bookings");
  };

  // No bookings state
  if (!bookings || bookings.length === 0) {
    return (
      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2 className="dashboard-panel-title">Upcoming Bookings</h2>
            <p className="dashboard-panel-subtitle">
              Today & next 24 hours bookings overview.
            </p>
          </div>
          <button className="dashboard-date-pill" onClick={handleViewAll}>
            View all
          </button>
        </div>

        <p style={{ padding: "20px", color: "#6b7280" }}>
          No upcoming bookings.
        </p>
      </section>
    );
  }

  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-header">
        <div>
          <h2 className="dashboard-panel-title">Upcoming Bookings</h2>
          <p className="dashboard-panel-subtitle">
            Today & next 24 hours bookings overview.
          </p>
        </div>
        <button className="dashboard-date-pill" onClick={handleViewAll}>
          View all
        </button>
      </div>

      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Field</th>
            <th>Customer</th>
            <th>Date & Time</th>
            <th>Status</th>
            <th>Payment</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b._id}>
              <td>{b.bookingCode || b._id.slice(-6).toUpperCase()}</td>

              <td>{b.fieldName}</td>

              <td>{b.customerName}</td>

              <td>
                {b.dateFormatted || (b.date ? new Date(b.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }) : "N/A")}
                <br />
                <span style={{ color: "#64748b", fontSize: "12px" }}>
                  {b.timeRange || (b.time ? `${b.time} (${b.duration || 1}h)` : "N/A")}
                </span>
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
                <span
                  className={
                    "badge " +
                    (b.paymentStatus === "paid" || b.paymentStatus === "Paid"
                      ? "badge-success"
                      : b.paymentStatus === "refunded" || b.paymentStatus === "Refunded"
                      ? "badge-danger"
                      : "badge-warning")
                  }
                >
                  {b.paymentStatus ? b.paymentStatus.charAt(0).toUpperCase() + b.paymentStatus.slice(1).toLowerCase() : "Pending"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default BookingsTable;
