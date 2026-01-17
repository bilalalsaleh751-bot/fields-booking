// src/dashboard/pages/OwnerFinancial.jsx
import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import "../dashboard.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";


function OwnerFinancial() {
  const location = useLocation();
  
  const [ownerName, setOwnerName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [financial, setFinancial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("thisMonth"); // thisMonth | lastMonth

  useEffect(() => {
    const storedName = localStorage.getItem("ownerName");
    const storedId = localStorage.getItem("ownerId");
    if (storedName) setOwnerName(storedName);
    if (storedId) setOwnerId(storedId);
  }, []);

  const fetchFinancial = useCallback(async () => {
    if (!ownerId) return;
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/api/owner/dashboard/overview?ownerId=${ownerId}`
      );
      const data = await res.json();
      if (res.ok) setFinancial(data.financial);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  // Fetch financial on mount and when navigating back
  useEffect(() => {
    fetchFinancial();
  }, [fetchFinancial, location.key]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
    <>
      <DashboardHeader ownerName={ownerName} />

      <div className="dashboard-panel" style={{ marginBottom: 20 }}>
        <div className="dashboard-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 className="dashboard-panel-title">Financial Overview</h2>
            <p className="dashboard-panel-subtitle">Your earnings and payment breakdown</p>
          </div>
          <div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 14,
                fontWeight: 500,
                color: "#334155",
                background: "white",
                cursor: "pointer",
              }}
            >
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="dashboard-panel">
          <p className="dashboard-loading">Loading financial data…</p>
        </div>
      )}

      {!loading && financial && (
        <>
          {/* Period-based earnings calculation */}
          {(() => {
            const isThisMonth = period === "thisMonth";
            const earnings = isThisMonth ? financial.thisMonthEarnings : financial.lastMonthEarnings;
            const commission = earnings * financial.commissionRate;
            const netEarnings = earnings - commission;
            const completedCount = isThisMonth ? financial.completedBookings : financial.lastMonthCompletedBookings;
            const activeFieldsCount = isThisMonth ? financial.activeFieldsWithEarnings : 0;
            
            return (
              <>
                {/* Earnings Summary */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
                  <div className="dashboard-panel" style={{ margin: 0, padding: 16 }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>
                      {isThisMonth ? "This Month Earnings" : "Last Month Earnings"}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
                      {formatCurrency(earnings)}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                      From {completedCount || 0} completed booking{completedCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="dashboard-panel" style={{ margin: 0, padding: 16 }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Active Fields</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
                      {isThisMonth ? activeFieldsCount : "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                      {isThisMonth ? "With completed bookings" : "N/A for last month"}
                    </div>
                  </div>
                  <div className="dashboard-panel" style={{ margin: 0, padding: 16 }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Platform Commission ({(financial.commissionRate * 100).toFixed(0)}%)</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#ef4444" }}>
                      -{formatCurrency(commission)}
                    </div>
                  </div>
                  <div className="dashboard-panel" style={{ margin: 0, padding: 16 }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Net to You</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#22c55e" }}>
                      {formatCurrency(netEarnings)}
                    </div>
                  </div>
                </div>

                {/* Booking Status Breakdown - Only show for this month */}
                {isThisMonth && (
                  <div className="dashboard-panel">
                    <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
                      Booking Status (This Month)
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                      <div style={{ 
                        padding: 16, 
                        background: "#f0fdf4", 
                        borderRadius: 10,
                        border: "1px solid #bbf7d0"
                      }}>
                        <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 500, marginBottom: 4 }}>Completed</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: "#15803d" }}>{financial.completedBookings || 0}</div>
                        <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4 }}>Earnings counted</div>
                      </div>
                      <div style={{ 
                        padding: 16, 
                        background: "#eff6ff", 
                        borderRadius: 10,
                        border: "1px solid #bfdbfe"
                      }}>
                        <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 500, marginBottom: 4 }}>Confirmed</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: "#1d4ed8" }}>{financial.confirmedBookings || 0}</div>
                        <div style={{ fontSize: 11, color: "#2563eb", marginTop: 4 }}>Awaiting completion</div>
                      </div>
                      <div style={{ 
                        padding: 16, 
                        background: "#fefce8", 
                        borderRadius: 10,
                        border: "1px solid #fef08a"
                      }}>
                        <div style={{ fontSize: 12, color: "#ca8a04", fontWeight: 500, marginBottom: 4 }}>Pending</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: "#a16207" }}>{financial.pendingBookings || 0}</div>
                        <div style={{ fontSize: 11, color: "#ca8a04", marginTop: 4 }}>Awaiting confirmation</div>
                      </div>
                      <div style={{ 
                        padding: 16, 
                        background: "#fef2f2", 
                        borderRadius: 10,
                        border: "1px solid #fecaca"
                      }}>
                        <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 500, marginBottom: 4 }}>Cancelled</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: "#b91c1c" }}>{financial.cancelledBookings || 0}</div>
                        <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>Refunded</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Commission Explanation */}
                <div className="dashboard-panel" style={{ marginTop: 20, background: "#f8fafc" }}>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 600, color: "#475569" }}>
                    How Earnings Work
                  </h3>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                    <p style={{ margin: "0 0 8px 0" }}>
                      • <strong>Earnings Source:</strong> Only <em>completed</em> bookings count towards your earnings
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      • <strong>Pending/Confirmed:</strong> These bookings do not affect earnings until marked as completed
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      • <strong>Platform Commission:</strong> {(financial.commissionRate * 100).toFixed(0)}% deducted for platform services
                    </p>
                    <p style={{ margin: 0 }}>
                      • <strong>Net to Owner:</strong> Your final payout after commission
                    </p>
                  </div>
                </div>
              </>
            );
          })()}
        </>
      )}

      {!loading && !financial && (
        <div className="dashboard-panel">
          <p className="dashboard-empty">No financial data available.</p>
        </div>
      )}
    </>
  );
}

export default OwnerFinancial;

