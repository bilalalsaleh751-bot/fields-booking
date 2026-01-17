import { useState, useEffect } from "react";
import "./AccountPages.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";


export default function AccountProfile() {
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
        });
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Profile updated successfully" });
        localStorage.setItem("userName", profile.name);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update profile" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Server error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="account-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="account-page">
      <div className="account-page-header">
        <h1>My Profile</h1>
        <p>Manage your account information</p>
      </div>

      {message && (
        <div className={`account-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="account-card">
        <form onSubmit={handleSave} className="account-form">
          <div className="account-field">
            <label>Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              required
            />
          </div>

          <div className="account-field">
            <label>Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="disabled"
            />
            <span className="field-hint">Email cannot be changed</span>
          </div>

          <div className="account-field">
            <label>Phone</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+961 XX XXX XXX"
            />
          </div>

          <button type="submit" className="account-save-btn" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

