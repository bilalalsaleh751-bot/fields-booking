// src/dashboard/pages/OwnerSettings.jsx
// PDR Owner Settings - Profile, Business, Payment, Notifications
import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import "../dashboard.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";


function OwnerSettings() {
  const location = useLocation();

  const [ownerName, setOwnerName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [activeSection, setActiveSection] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Settings data
  const [profile, setProfile] = useState({ fullName: "", email: "", phone: "" });
  const [business, setBusiness] = useState({ businessName: "", city: "", area: "", businessDescription: "" });
  const [payout, setPayout] = useState({ commissionPercentage: 15, totalEarnings: 0, netEarnings: 0, payoutMethod: "" });
  const [notifications, setNotifications] = useState({ bookingCompleted: true, bookingCancelled: true, newReview: true });

  // Password change
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    const storedName = localStorage.getItem("ownerName");
    const storedId = localStorage.getItem("ownerId");
    if (storedName) setOwnerName(storedName);
    if (storedId) setOwnerId(storedId);
  }, []);

  const fetchSettings = useCallback(async () => {
    if (!ownerId) return;
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/api/owner/settings?ownerId=${ownerId}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        setBusiness(data.business);
        setPayout(data.payout);
        setNotifications(data.notifications);
      }
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings, location.key]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  // ===============================
  // SAVE PROFILE
  // ===============================
  const handleSaveProfile = async () => {
    if (!ownerId) {
      showMessage("error", "Owner ID not found. Please refresh the page.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/owner/settings/profile/${ownerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName: profile.fullName, phone: profile.phone }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        showMessage("success", "Profile updated successfully");
        localStorage.setItem("ownerName", profile.fullName);
        setOwnerName(profile.fullName);
      } else {
        showMessage("error", data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      showMessage("error", "Network error. Is the server running?");
    } finally {
      setSaving(false);
    }
  };

  // ===============================
  // CHANGE PASSWORD
  // ===============================
  const handleChangePassword = async () => {
    if (!ownerId) {
      showMessage("error", "Owner ID not found. Please refresh the page.");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      showMessage("error", "New passwords do not match");
      return;
    }
    if (passwords.newPassword.length < 6) {
      showMessage("error", "Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/owner/settings/password/${ownerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        showMessage("success", "Password changed successfully");
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        showMessage("error", data.message || "Failed to change password");
      }
    } catch (err) {
      console.error("Change password error:", err);
      showMessage("error", "Network error. Is the server running?");
    } finally {
      setSaving(false);
    }
  };

  // ===============================
  // SAVE BUSINESS INFO
  // ===============================
  const handleSaveBusiness = async () => {
    if (!ownerId) {
      showMessage("error", "Owner ID not found. Please refresh the page.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/owner/settings/business/${ownerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(business),
        }
      );
      const data = await res.json();
      if (res.ok) {
        showMessage("success", "Business info updated successfully");
      } else {
        showMessage("error", data.message || "Failed to update business info");
      }
    } catch (err) {
      console.error("Save business error:", err);
      showMessage("error", "Network error. Is the server running?");
    } finally {
      setSaving(false);
    }
  };

  // ===============================
  // SAVE NOTIFICATIONS
  // ===============================
  const handleSaveNotifications = async () => {
    if (!ownerId) {
      showMessage("error", "Owner ID not found. Please refresh the page.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/owner/settings/notifications/${ownerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(notifications),
        }
      );
      const data = await res.json();
      if (res.ok) {
        showMessage("success", "Notification preferences saved");
      } else {
        showMessage("error", data.message || "Failed to save preferences");
      }
    } catch (err) {
      console.error("Save notifications error:", err);
      showMessage("error", "Network error. Is the server running?");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const sections = [
    { key: "profile", label: "Profile Info", icon: "👤" },
    { key: "business", label: "Business Info", icon: "🏢" },
    { key: "payout", label: "Payment / Payout", icon: "💳" },
    { key: "notifications", label: "Notifications", icon: "🔔" },
  ];

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    fontSize: 14,
    color: "#1e293b",
    background: "white",
  };

  const labelStyle = {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "#475569",
    marginBottom: 6,
  };

  return (
    <>
      <DashboardHeader ownerName={ownerName} />

      <div className="dashboard-panel" style={{ marginBottom: 20 }}>
        <div className="dashboard-panel-header">
          <div>
            <h2 className="dashboard-panel-title">Settings</h2>
            <p className="dashboard-panel-subtitle">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      {/* Message Toast */}
      {message.text && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            padding: "12px 20px",
            borderRadius: 10,
            background: message.type === "success" ? "#22c55e" : "#ef4444",
            color: "white",
            fontWeight: 500,
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="dashboard-panel">
          <p className="dashboard-loading">Loading settings…</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20 }}>
          {/* Settings Sidebar */}
          <div className="dashboard-panel" style={{ padding: 0, margin: 0 }}>
            <div style={{ padding: 16 }}>
              {sections.map((section) => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    marginBottom: 4,
                    borderRadius: 10,
                    border: "none",
                    background: activeSection === section.key ? "#eff6ff" : "transparent",
                    color: activeSection === section.key ? "#3b82f6" : "#475569",
                    fontSize: 14,
                    fontWeight: activeSection === section.key ? 600 : 500,
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span>{section.icon}</span>
                  <span>{section.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Settings Content */}
          <div className="dashboard-panel" style={{ margin: 0 }}>
            {/* PROFILE INFO */}
            {activeSection === "profile" && (
              <div>
                <h3 style={{ margin: "0 0 20px 0", fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
                  Profile Information
                </h3>

                <div style={{ display: "grid", gap: 16, maxWidth: 480 }}>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      style={{ ...inputStyle, background: "#f8fafc", color: "#94a3b8", cursor: "not-allowed" }}
                    />
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Email cannot be changed</p>
                  </div>

                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="dashboard-primary-btn"
                    style={{ width: "fit-content", marginTop: 8 }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                {/* Change Password Section */}
                <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
                    Change Password
                  </h4>

                  <div style={{ display: "grid", gap: 16, maxWidth: 480 }}>
                    <div>
                      <label style={labelStyle}>Current Password</label>
                      <input
                        type="password"
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>New Password</label>
                      <input
                        type="password"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Confirm New Password</label>
                      <input
                        type="password"
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        style={inputStyle}
                      />
                    </div>

                    <button
                      onClick={handleChangePassword}
                      disabled={saving || !passwords.currentPassword || !passwords.newPassword}
                      className="dashboard-secondary-btn"
                      style={{ width: "fit-content" }}
                    >
                      {saving ? "Changing..." : "Change Password"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BUSINESS INFO */}
            {activeSection === "business" && (
              <div>
                <h3 style={{ margin: "0 0 20px 0", fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
                  Business Information
                </h3>

                <div style={{ display: "grid", gap: 16, maxWidth: 600 }}>
                  <div>
                    <label style={labelStyle}>Business Name</label>
                    <input
                      type="text"
                      value={business.businessName}
                      onChange={(e) => setBusiness({ ...business, businessName: e.target.value })}
                      placeholder="Your business or field name"
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={labelStyle}>City</label>
                      <input
                        type="text"
                        value={business.city}
                        onChange={(e) => setBusiness({ ...business, city: e.target.value })}
                        placeholder="e.g. Beirut"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Area</label>
                      <input
                        type="text"
                        value={business.area}
                        onChange={(e) => setBusiness({ ...business, area: e.target.value })}
                        placeholder="e.g. Downtown"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Business Description</label>
                    <textarea
                      value={business.businessDescription}
                      onChange={(e) => setBusiness({ ...business, businessDescription: e.target.value })}
                      placeholder="Describe your sports facility..."
                      rows={4}
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </div>

                  <button
                    onClick={handleSaveBusiness}
                    disabled={saving}
                    className="dashboard-primary-btn"
                    style={{ width: "fit-content", marginTop: 8 }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* PAYMENT / PAYOUT INFO */}
            {activeSection === "payout" && (
              <div>
                <h3 style={{ margin: "0 0 20px 0", fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
                  Payment & Payout Information
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
                  <div style={{ padding: 20, background: "#f8fafc", borderRadius: 12 }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Total Earnings</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>
                      {formatCurrency(payout.totalEarnings)}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>From completed bookings</div>
                  </div>

                  <div style={{ padding: 20, background: "#fef2f2", borderRadius: 12 }}>
                    <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 4 }}>Platform Commission</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#b91c1c" }}>
                      -{formatCurrency(payout.platformCommission)}
                    </div>
                    <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>{payout.commissionPercentage}% of earnings</div>
                  </div>

                  <div style={{ padding: 20, background: "#f0fdf4", borderRadius: 12 }}>
                    <div style={{ fontSize: 12, color: "#16a34a", marginBottom: 4 }}>Net Earnings</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#15803d" }}>
                      {formatCurrency(payout.netEarnings)}
                    </div>
                    <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4 }}>Your payout amount</div>
                  </div>
                </div>

                <div style={{ padding: 20, background: "#f8fafc", borderRadius: 12, marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Platform Commission Rate</div>
                      <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                        Standard rate applied to all completed bookings
                      </div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#3b82f6" }}>
                      {payout.commissionPercentage}%
                    </div>
                  </div>
                </div>

                <div style={{ padding: 20, background: "#fffbeb", borderRadius: 12, border: "1px solid #fef08a" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 20 }}>🏦</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#92400e" }}>Payout Method</div>
                      <div style={{ fontSize: 13, color: "#a16207", marginTop: 4 }}>
                        {payout.payoutMethod || "Bank Transfer (Coming Soon)"}
                      </div>
                      <div style={{ fontSize: 12, color: "#a16207", marginTop: 8, fontStyle: "italic" }}>
                        Automatic payouts will be available in a future update. Your earnings are being tracked.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeSection === "notifications" && (
              <div>
                <h3 style={{ margin: "0 0 20px 0", fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
                  Notification Preferences
                </h3>

                <div style={{ display: "grid", gap: 16, maxWidth: 480 }}>
                  {[
                    { key: "bookingCompleted", label: "Booking Completed", description: "When a booking is marked as completed" },
                    { key: "bookingCancelled", label: "Booking Cancelled", description: "When a booking is cancelled" },
                    { key: "newReview", label: "New Review", description: "When a customer leaves a review" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: 16,
                        background: "#f8fafc",
                        borderRadius: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{item.description}</div>
                      </div>
                      <label style={{ position: "relative", display: "inline-block", width: 48, height: 26 }}>
                        <input
                          type="checkbox"
                          checked={notifications[item.key]}
                          onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            cursor: "pointer",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: notifications[item.key] ? "#3b82f6" : "#cbd5e1",
                            borderRadius: 26,
                            transition: "0.2s",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              height: 20,
                              width: 20,
                              left: notifications[item.key] ? 25 : 3,
                              bottom: 3,
                              background: "white",
                              borderRadius: "50%",
                              transition: "0.2s",
                            }}
                          />
                        </span>
                      </label>
                    </div>
                  ))}

                  <button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="dashboard-primary-btn"
                    style={{ width: "fit-content", marginTop: 16 }}
                  >
                    {saving ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default OwnerSettings;

