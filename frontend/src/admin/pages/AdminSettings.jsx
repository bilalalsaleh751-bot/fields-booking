// src/admin/pages/AdminSettings.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function AdminSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({});
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [newCity, setNewCity] = useState("");

  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const isSuperAdmin = adminData.role === "super_admin";

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");

      if (activeTab === "general" || activeTab === "gateway") {
        const res = await fetch("http://localhost:5000/api/admin/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        setSettings(data.settings || {});
      } else if (activeTab === "cities") {
        const res = await fetch("http://localhost:5000/api/admin/settings/cities", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch cities");
        const data = await res.json();
        setCities(data.cities || []);
      }
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("http://localhost:5000/api/admin/settings", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platformName: settings.platformName,
          supportEmail: settings.supportEmail,
          supportPhone: settings.supportPhone,
          maintenanceMode: settings.maintenanceMode,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to save settings");
      }

      // Update local state with returned settings if available
      if (data.settings) {
        setSettings(data.settings);
      }
      
      showToast("success", "Settings saved");
    } catch (err) {
      console.error("Save settings error:", err);
      showToast("error", err.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCity = async () => {
    if (!newCity.trim()) return;

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("http://localhost:5000/api/admin/settings/cities", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCity }),
      });

      if (!res.ok) throw new Error("Failed to add city");

      showToast("success", "City added");
      setNewCity("");
      fetchData();
    } catch (err) {
      showToast("error", err.message);
    }
  };

  const handleDeleteCity = async (cityId) => {
    if (!confirm("Delete this city?")) return;

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`http://localhost:5000/api/admin/settings/cities/${cityId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete city");

      showToast("success", "City deleted");
      fetchData();
    } catch (err) {
      showToast("error", err.message);
    }
  };

  const tabs = [
    { id: "general", label: "General" },
    { id: "gateway", label: "Payment Gateway" },
    { id: "cities", label: "Cities / Areas" },
  ];

  return (
    <div>
      {toast && (
        <div className={`admin-toast ${toast.type}`}>{toast.message}</div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-empty">Loading...</div>
      ) : (
        <>
          {/* General Settings */}
          {activeTab === "general" && (
            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">General Settings</h3>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Platform Name</label>
                <input
                  className="admin-form-input"
                  value={settings.platformName || ""}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Support Email</label>
                <input
                  type="email"
                  className="admin-form-input"
                  value={settings.supportEmail || ""}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Support Phone</label>
                <input
                  className="admin-form-input"
                  value={settings.supportPhone || ""}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode || false}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  />
                  <span>Maintenance Mode</span>
                </label>
              </div>
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleSaveSettings}
                disabled={saving || !isSuperAdmin}
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
              {!isSuperAdmin && (
                <p style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>
                  Only super_admin can modify settings
                </p>
              )}
            </div>
          )}

          {/* Payment Gateway */}
          {activeTab === "gateway" && (
            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">Payment Gateway Settings</h3>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Provider</label>
                <select
                  className="admin-form-select"
                  value={settings.paymentGateway?.provider || "stripe"}
                  disabled={!isSuperAdmin}
                >
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={settings.paymentGateway?.isEnabled || false}
                    disabled={!isSuperAdmin}
                  />
                  <span>Enable Payment Gateway</span>
                </label>
              </div>
              <div className="admin-form-group">
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={settings.paymentGateway?.testMode !== false}
                    disabled={!isSuperAdmin}
                  />
                  <span>Test Mode</span>
                </label>
              </div>
              <p style={{ color: "#64748b", fontSize: 13 }}>
                ⚠️ Payment gateway integration is a placeholder. Real payment processing is not implemented.
              </p>
            </div>
          )}

          {/* Cities */}
          {activeTab === "cities" && (
            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">Cities / Areas</h3>
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <input
                  className="admin-form-input"
                  placeholder="New city name..."
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="admin-btn admin-btn-primary" onClick={handleAddCity}>
                  Add City
                </button>
              </div>
              {cities.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-icon">🏙️</div>
                  <div className="admin-empty-title">No cities configured</div>
                </div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>City Name</th>
                        <th>Areas</th>
                        <th>Active</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cities.map((city) => (
                        <tr key={city._id}>
                          <td style={{ fontWeight: 500 }}>{city.name}</td>
                          <td>{city.areas?.length || 0} areas</td>
                          <td>{city.isActive ? "✅" : "❌"}</td>
                          <td>
                            <button
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              onClick={() => handleDeleteCity(city._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminSettings;

