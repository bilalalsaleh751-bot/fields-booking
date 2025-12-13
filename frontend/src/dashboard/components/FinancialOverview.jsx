// src/dashboard/components/FinancialOverview.jsx
import { useNavigate } from "react-router-dom";

function FinancialOverview({ financial }) {
  const navigate = useNavigate();
  
  const handleViewDetails = () => {
    navigate("/owner/financial");
  };

  if (!financial) {
    return (
      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2 className="dashboard-panel-title">Financial Overview</h2>
            <p className="dashboard-panel-subtitle">
              Earnings & commission breakdown for this month.
            </p>
          </div>
          <button className="dashboard-date-pill" onClick={handleViewDetails}>
            View details
          </button>
        </div>

        <p style={{ padding: "20px", color: "#6b7280" }}>Loading...</p>
      </section>
    );
  }

  const summary = {
    thisMonth: financial.thisMonthEarnings ?? financial.totalEarningsThisMonth ?? 0,
    lastMonth: financial.lastMonthEarnings ?? 0,
    commissionRate: financial.commissionRate ?? 15,
    platformCommission: financial.platformCommission ?? financial.commission ?? 0,
    ownerNet: financial.netToOwner ?? 0,
  };

  const miniStats = [
    { label: "Paid bookings", value: financial.paidBookings ?? 0 },
    { label: "Pending payments", value: financial.pendingPayments ?? 0 },
    { label: "Refunded", value: financial.refunded ?? 0 },
  ];

  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-header">
        <div>
          <h2 className="dashboard-panel-title">Financial Overview</h2>
          <p className="dashboard-panel-subtitle">
            Earnings & commission breakdown for this month.
          </p>
        </div>
        <button className="dashboard-date-pill" onClick={handleViewDetails}>
          View details
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          marginTop: 4,
        }}
      >
        {/* This Month Earnings */}
        <div
          style={{
            padding: "20px",
            borderRadius: 14,
            background:
              "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(56,189,248,0.1))",
            border: "1px solid rgba(34,197,94,0.2)",
            boxShadow: "0 1px 3px rgba(34,197,94,0.1)",
          }}
        >
          <div style={{ fontSize: 12, color: "#166534", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>This month total</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#14532d", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            ${summary.thisMonth.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: "#166534", marginTop: 8, opacity: 0.8 }}>
            Last month: ${summary.lastMonth.toLocaleString()}
          </div>
        </div>

        {/* Commission & Net */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <div
            style={{
              padding: "16px",
              borderRadius: 12,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginBottom: 6 }}>
              Platform commission ({((summary.commissionRate ?? 0.15) * 100).toFixed(0)}%)
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
              ${summary.platformCommission.toLocaleString()}
            </div>
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: 12,
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
            }}
          >
            <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, marginBottom: 6 }}>Net to owner</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#166534", letterSpacing: "-0.01em" }}>
              ${summary.ownerNet.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Mini Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 10,
            marginTop: 4,
          }}
        >
          {miniStats.map((item) => (
            <div
              key={item.label}
              style={{
                padding: "12px",
                borderRadius: 10,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.borderColor = "#cbd5e1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FinancialOverview;
