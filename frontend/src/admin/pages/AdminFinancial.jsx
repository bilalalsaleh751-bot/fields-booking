// src/admin/pages/AdminFinancial.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";


function AdminFinancial() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [commissionRate, setCommissionRate] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);

  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const canUpdateCommission = adminData.role === "super_admin";

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");

      const [overviewRes, transactionsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/financial/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/admin/financial/transactions?page=${page}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!overviewRes.ok || !transactionsRes.ok) {
        if (overviewRes.status === 401 || transactionsRes.status === 401) {
          navigate("/login");
          return;
        }
        throw new Error("Failed to fetch financial data");
      }

      const overviewData = await overviewRes.json();
      const transactionsData = await transactionsRes.json();

      setOverview(overviewData);
      setCommissionRate(overviewData.commissionRate || 15);
      setTransactions(transactionsData.transactions || []);
      setPagination(transactionsData.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error("Fetch financial error:", err);
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateCommission = async () => {
    if (!canUpdateCommission) {
      showToast("error", "Only super_admin can update commission rate");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE}/api/admin/financial/commission`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commissionRate }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update commission");
      }

      // Immediately update local state with returned commission rate
      if (data.commissionRate !== undefined) {
        setCommissionRate(data.commissionRate);
        // Also update overview if it exists
        if (overview) {
          setOverview({ ...overview, commissionRate: data.commissionRate });
        }
      }
      
      showToast("success", "Commission rate updated successfully");
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-empty">
        <div className="admin-empty-icon">⏳</div>
        <p>Loading financial data...</p>
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className={`admin-toast ${toast.type}`}>{toast.message}</div>
      )}

      {/* Overview Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-label">Total Revenue</span>
          <span className="admin-stat-value">
            ${(overview?.totals?.totalRevenue || 0).toLocaleString()}
          </span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Platform Commission</span>
          <span className="admin-stat-value">
            ${(overview?.totals?.totalCommission || 0).toLocaleString()}
          </span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Net to Owners</span>
          <span className="admin-stat-value">
            ${(overview?.totals?.totalNetToOwners || 0).toLocaleString()}
          </span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Transactions</span>
          <span className="admin-stat-value">
            {overview?.totals?.count || 0}
          </span>
        </div>
      </div>

      {/* Commission Rate */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title">Commission Rate</h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <input
            type="number"
            value={commissionRate}
            onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
            min="0"
            max="100"
            step="0.5"
            disabled={!canUpdateCommission}
            className="admin-form-input"
            style={{ width: 100 }}
          />
          <span style={{ color: "#64748b" }}>%</span>
          <button
            className="admin-btn admin-btn-primary"
            onClick={handleUpdateCommission}
            disabled={saving || !canUpdateCommission}
          >
            {saving ? "Saving..." : "Update"}
          </button>
          {!canUpdateCommission && (
            <span style={{ fontSize: 12, color: "#ef4444" }}>
              Only super_admin can modify
            </span>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Transaction History</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">💰</div>
            <div className="admin-empty-title">No transactions yet</div>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Field</th>
                    <th>Owner</th>
                    <th>Gross</th>
                    <th>Commission</th>
                    <th>Net to Owner</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id}>
                      <td>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td>{tx.fieldId?.name || tx.fieldName || "—"}</td>
                      <td>{tx.ownerId?.fullName || "—"}</td>
                      <td style={{ fontWeight: 600 }}>
                        ${tx.amountGross.toLocaleString()}
                      </td>
                      <td style={{ color: "#3b82f6" }}>
                        ${tx.commissionAmount.toLocaleString()} ({tx.commissionRate}%)
                      </td>
                      <td style={{ color: "#22c55e" }}>
                        ${tx.netToOwner.toLocaleString()}
                      </td>
                      <td>
                        <span className={`admin-badge ${tx.status}`}>
                          {tx.status}
                        </span>
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
                Page {page} of {pagination.pages}
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

export default AdminFinancial;

