// src/admin/pages/AdminUsers.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({ status: "", role: "", search: "" });
  const [showModal, setShowModal] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.role) params.append("role", filters.role);
      if (filters.search) params.append("search", filters.search);

      const res = await fetch(`http://localhost:5000/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 401) {
          navigate("/admin/login");
          return;
        }
        throw new Error("Failed to fetch users");
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setUsers(users.map((u) => (u._id === userId ? { ...u, ...data.user } : u)));
      showToast("success", "Role updated");
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (userId, activate) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem("adminToken");
      const action = activate ? "activate" : "deactivate";
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/${action}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setUsers(users.map((u) => (u._id === userId ? { ...u, ...data.user } : u)));
      showToast("success", `User ${activate ? "activated" : "deactivated"}`);
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async () => {
    if (!showModal || !newPassword) return;
    
    setActionLoading(showModal._id);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`http://localhost:5000/api/admin/users/${showModal._id}/reset-password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast("success", "Password reset successfully");
      setShowModal(null);
      setNewPassword("");
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: { bg: "#fef3c7", color: "#d97706" },
      owner: { bg: "#dbeafe", color: "#2563eb" },
      user: { bg: "#f1f5f9", color: "#475569" },
    };
    const style = styles[role] || styles.user;
    return (
      <span
        style={{
          padding: "4px 10px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          background: style.bg,
          color: style.color,
          textTransform: "capitalize",
        }}
      >
        {role}
      </span>
    );
  };

  return (
    <div>
      {toast && <div className={`admin-toast ${toast.type}`}>{toast.message}</div>}

      {/* Filters */}
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            className="admin-form-input"
            style={{ flex: 1, minWidth: 200 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <select
            className="admin-form-select"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="admin-form-select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Platform Users</h3>
          <span style={{ color: "#64748b", fontSize: 14 }}>{users.length} users</span>
        </div>

        {loading ? (
          <div className="admin-empty">Loading...</div>
        ) : users.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">👤</div>
            <div className="admin-empty-title">No users found</div>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td style={{ fontWeight: 500 }}>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || "—"}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        disabled={actionLoading === user._id}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid #e2e8f0",
                          fontSize: 13,
                        }}
                      >
                        <option value="user">User</option>
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      {user.isActive ? (
                        <span style={{ color: "#16a34a" }}>✓ Active</span>
                      ) : (
                        <span style={{ color: "#dc2626" }}>✗ Inactive</span>
                      )}
                    </td>
                    <td style={{ fontSize: 13, color: "#64748b" }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className={`admin-btn admin-btn-sm ${user.isActive ? "admin-btn-danger" : "admin-btn-primary"}`}
                          onClick={() => handleToggleActive(user._id, !user.isActive)}
                          disabled={actionLoading === user._id}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          className="admin-btn admin-btn-outline admin-btn-sm"
                          onClick={() => setShowModal(user)}
                        >
                          Reset Pwd
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Reset Password</h3>
              <button className="admin-modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ marginBottom: 16, color: "#64748b" }}>
                Reset password for: <strong>{showModal.email}</strong>
              </p>
              <div className="admin-form-group">
                <label className="admin-form-label">New Password</label>
                <input
                  type="password"
                  className="admin-form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowModal(null)}>
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleResetPassword}
                disabled={!newPassword || newPassword.length < 6 || actionLoading}
              >
                {actionLoading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;

