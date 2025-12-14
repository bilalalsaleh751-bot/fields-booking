// src/dashboard/components/DashboardHeader.jsx
import { useState, useEffect, useCallback, useRef } from "react";

function DashboardHeader({ ownerName, onAddField }) {
  const [ownerId, setOwnerId] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  useEffect(() => {
    const storedId = localStorage.getItem("ownerId");
    if (storedId) setOwnerId(storedId);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!ownerId) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/owner/notifications?ownerId=${ownerId}&limit=10`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [ownerId]);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch("http://localhost:5000/api/owner/notifications/read-all", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "completed": return "✅";
      case "cancelled": return "❌";
      case "review": return "⭐";
      default: return "🔔";
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-left">
        <h1 className="dashboard-page-title">Owner Dashboard</h1>
        <p className="dashboard-page-subtitle">
          Monitor your fields, bookings, and earnings in real-time.
        </p>
      </div>

      <div className="dashboard-header-right">
        <div className="dashboard-date-pill">{formattedDate}</div>

        {/* Notifications Bell */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              position: "relative",
              width: 40,
              height: 40,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  background: "#ef4444",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div
              style={{
                position: "absolute",
                top: 48,
                right: 0,
                width: 340,
                maxHeight: 400,
                overflowY: "auto",
                background: "white",
                borderRadius: 12,
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                border: "1px solid #e2e8f0",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 600, color: "#0f172a" }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#3b82f6",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #f1f5f9",
                      background: n.isRead ? "white" : "#f8fafc",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{getNotificationIcon(n.type)}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.4 }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{formatTime(n.createdAt)}</span>
                    </div>
                    {!n.isRead && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#3b82f6",
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button className="dashboard-primary-btn" onClick={onAddField}>
          <span>＋</span>
          <span>Add New Field</span>
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;
