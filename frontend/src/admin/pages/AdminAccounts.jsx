// src/admin/pages/AdminAccounts.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function AdminAccounts() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("admins");
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(null); // "create-admin" | "create-user" | "create-owner" | "reset-pwd" | "edit-self"
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("http://localhost:5000/api/admin/admins", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 403) {
          showToast("error", "Access denied - Super Admin only");
          return;
        }
        throw new Error("Failed to fetch admins");
      }

      const data = await res.json();
      setAdmins(data.admins || []);
    } catch (err) {
      console.error(err);
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleCreateAdmin = async () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      showToast("error", "All fields required");
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("http://localhost:5000/api/admin/admins", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast("success", "Admin created successfully");
      setShowModal(null);
      setFormData({});
      fetchAdmins();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      showToast("error", "Name, email and password required");
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("http://localhost:5000/api/admin/accounts/user", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast("success", "User created successfully");
      setShowModal(null);
      setFormData({});
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateOwner = async () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      showToast("error", "Name, email and password required");
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("http://localhost:5000/api/admin/accounts/owner", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast("success", "Owner created successfully");
      setShowModal(null);
      setFormData({});
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSelf = async () => {
    if (!formData.currentPassword) {
      showToast("error", "Current password required");
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("http://localhost:5000/api/admin/account/self", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Update token if returned
      if (data.token) {
        localStorage.setItem("adminToken", data.token);
      }

      showToast("success", "Account updated successfully");
      setShowModal(null);
      setFormData({});
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (admin, isActive) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`http://localhost:5000/api/admin/admins/${admin._id}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setAdmins(admins.map((a) => (a._id === admin._id ? { ...a, isActive } : a)));
      showToast("success", `Admin ${isActive ? "activated" : "deactivated"}`);
    } catch (err) {
      showToast("error", err.message);
    }
  };

  const handleRoleChange = async (admin, newRole) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`http://localhost:5000/api/admin/admins/${admin._id}/role`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setAdmins(admins.map((a) => (a._id === admin._id ? { ...a, role: newRole } : a)));
      showToast("success", "Role updated");
    } catch (err) {
      showToast("error", err.message);
    }
  };

  const handleResetPassword = async () => {
    if (!formData.newPassword || formData.newPassword.length < 6) {
      showToast("error", "Password must be at least 6 characters");
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`http://localhost:5000/api/admin/admins/${selectedItem._id}/reset-password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword: formData.newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast("success", "Password reset successfully");
      setShowModal(null);
      setSelectedItem(null);
      setFormData({});
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      super_admin: { bg: "#fef3c7", color: "#d97706" },
      admin: { bg: "#dbeafe", color: "#2563eb" },
      support: { bg: "#f1f5f9", color: "#475569" },
    };
    const style = colors[role] || colors.admin;
    return (
      <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: style.bg, color: style.color }}>
        {role.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  return (
    <div>
      {toast && <div className={`admin-toast ${toast.type}`}>{toast.message}</div>}

      {/* Action Buttons */}
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="admin-btn admin-btn-primary" onClick={() => { setShowModal("create-admin"); setFormData({ role: "admin" }); }}>
            + Create Admin
          </button>
          <button className="admin-btn admin-btn-outline" onClick={() => { setShowModal("create-user"); setFormData({}); }}>
            + Create User
          </button>
          <button className="admin-btn admin-btn-outline" onClick={() => { setShowModal("create-owner"); setFormData({ status: "approved" }); }}>
            + Create Owner
          </button>
          <div style={{ flex: 1 }}></div>
          <button className="admin-btn admin-btn-secondary" onClick={() => { setShowModal("edit-self"); setFormData({}); }}>
            ⚙️ Edit My Account
          </button>
        </div>
      </div>

      {/* Admins Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Admin Accounts</h3>
          <span style={{ color: "#64748b", fontSize: 14 }}>{admins.length} admins</span>
        </div>

        {loading ? (
          <div className="admin-empty">Loading...</div>
        ) : admins.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">🛡️</div>
            <div className="admin-empty-title">No admins found</div>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin._id}>
                    <td style={{ fontWeight: 500 }}>{admin.fullName}</td>
                    <td>{admin.email}</td>
                    <td>
                      {admin.role === "super_admin" ? (
                        getRoleBadge(admin.role)
                      ) : (
                        <select
                          value={admin.role}
                          onChange={(e) => handleRoleChange(admin, e.target.value)}
                          style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13 }}
                        >
                          <option value="admin">Admin</option>
                          <option value="support">Support</option>
                        </select>
                      )}
                    </td>
                    <td>
                      {admin.isActive ? (
                        <span style={{ color: "#16a34a" }}>✓ Active</span>
                      ) : (
                        <span style={{ color: "#dc2626" }}>✗ Inactive</span>
                      )}
                    </td>
                    <td style={{ fontSize: 13, color: "#64748b" }}>
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {admin.role !== "super_admin" && (
                        <div className="admin-actions">
                          <button
                            className={`admin-btn admin-btn-sm ${admin.isActive ? "admin-btn-danger" : "admin-btn-primary"}`}
                            onClick={() => handleToggleStatus(admin, !admin.isActive)}
                          >
                            {admin.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            onClick={() => { setSelectedItem(admin); setShowModal("reset-pwd"); setFormData({}); }}
                          >
                            Reset Pwd
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {showModal === "create-admin" && "Create Admin"}
                {showModal === "create-user" && "Create User"}
                {showModal === "create-owner" && "Create Owner"}
                {showModal === "reset-pwd" && "Reset Password"}
                {showModal === "edit-self" && "Edit My Account"}
              </h3>
              <button className="admin-modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>
            <div className="admin-modal-body">
              {showModal === "create-admin" && (
                <>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Full Name *</label>
                    <input className="admin-form-input" value={formData.fullName || ""} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Email *</label>
                    <input type="email" className="admin-form-input" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Password *</label>
                    <input type="password" className="admin-form-input" value={formData.password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Role</label>
                    <select className="admin-form-select" value={formData.role || "admin"} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                      <option value="admin">Admin</option>
                      <option value="support">Support</option>
                    </select>
                  </div>
                </>
              )}

              {showModal === "create-user" && (
                <>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Name *</label>
                    <input className="admin-form-input" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Email *</label>
                    <input type="email" className="admin-form-input" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Password *</label>
                    <input type="password" className="admin-form-input" value={formData.password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Phone</label>
                    <input className="admin-form-input" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </>
              )}

              {showModal === "create-owner" && (
                <>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Full Name *</label>
                    <input className="admin-form-input" value={formData.fullName || ""} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Email *</label>
                    <input type="email" className="admin-form-input" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Password *</label>
                    <input type="password" className="admin-form-input" value={formData.password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Business Name</label>
                    <input className="admin-form-input" value={formData.businessName || ""} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Status</label>
                    <select className="admin-form-select" value={formData.status || "pending"} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                    </select>
                  </div>
                </>
              )}

              {showModal === "reset-pwd" && selectedItem && (
                <>
                  <p style={{ marginBottom: 16, color: "#64748b" }}>
                    Reset password for: <strong>{selectedItem.email}</strong>
                  </p>
                  <div className="admin-form-group">
                    <label className="admin-form-label">New Password *</label>
                    <input type="password" className="admin-form-input" value={formData.newPassword || ""} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} placeholder="Min 6 characters" />
                  </div>
                </>
              )}

              {showModal === "edit-self" && (
                <>
                  <div className="admin-form-group">
                    <label className="admin-form-label">New Email</label>
                    <input type="email" className="admin-form-input" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Leave blank to keep current" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">New Password</label>
                    <input type="password" className="admin-form-input" value={formData.newPassword || ""} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} placeholder="Leave blank to keep current" />
                  </div>
                  <div className="admin-form-group" style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
                    <label className="admin-form-label">Current Password * (required for changes)</label>
                    <input type="password" className="admin-form-input" value={formData.currentPassword || ""} onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })} />
                  </div>
                </>
              )}
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowModal(null)}>Cancel</button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  if (showModal === "create-admin") handleCreateAdmin();
                  if (showModal === "create-user") handleCreateUser();
                  if (showModal === "create-owner") handleCreateOwner();
                  if (showModal === "reset-pwd") handleResetPassword();
                  if (showModal === "edit-self") handleUpdateSelf();
                }}
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAccounts;

