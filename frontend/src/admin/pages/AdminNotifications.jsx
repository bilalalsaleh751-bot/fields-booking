// src/admin/pages/AdminNotifications.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function AdminNotifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("broadcast");
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  // Broadcast form
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [targetType, setTargetType] = useState("owners");

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");

      if (activeTab === "templates") {
        const res = await fetch("http://localhost:5000/api/admin/notifications/templates", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch templates");
        const data = await res.json();
        setTemplates(data.templates || []);
      } else if (activeTab === "logs") {
        const res = await fetch("http://localhost:5000/api/admin/notifications/logs?limit=50", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch logs");
        const data = await res.json();
        setLogs(data.notifications || []);
      }
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "broadcast") {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [fetchData, activeTab]);

  const handleSendBroadcast = async () => {
    if (!broadcastTitle || !broadcastMessage) {
      showToast("error", "Title and message are required");
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("http://localhost:5000/api/admin/notifications/broadcast", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          targetType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send broadcast");
      }

      showToast("success", `Broadcast sent to ${data.recipientCount} recipients`);
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setSending(false);
    }
  };

  const tabs = [
    { id: "broadcast", label: "Send Broadcast" },
    { id: "templates", label: "Templates" },
    { id: "logs", label: "Notification Logs" },
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

      {/* Broadcast Tab */}
      {activeTab === "broadcast" && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Send Broadcast Notification</h3>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Target Audience</label>
            <select
              className="admin-form-select"
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
            >
              <option value="owners">All Owners</option>
              <option value="all">Everyone</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Title</label>
            <input
              className="admin-form-input"
              placeholder="Notification title..."
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Message</label>
            <textarea
              className="admin-form-textarea"
              placeholder="Notification message..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              rows={5}
            />
          </div>
          <button
            className="admin-btn admin-btn-primary"
            onClick={handleSendBroadcast}
            disabled={sending}
          >
            {sending ? "Sending..." : "Send Broadcast"}
          </button>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Notification Templates</h3>
            <button className="admin-btn admin-btn-primary">+ Add Template</button>
          </div>
          {loading ? (
            <div className="admin-empty">Loading...</div>
          ) : templates.length === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">📝</div>
              <div className="admin-empty-title">No templates yet</div>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Trigger</th>
                    <th>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t._id}>
                      <td style={{ fontWeight: 500 }}>{t.name}</td>
                      <td>{t.type}</td>
                      <td>{t.trigger}</td>
                      <td>{t.isActive ? "✅" : "❌"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Notification Logs</h3>
          </div>
          {loading ? (
            <div className="admin-empty">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">📋</div>
              <div className="admin-empty-title">No notifications sent yet</div>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Owner</th>
                    <th>Type</th>
                    <th>Message</th>
                    <th>Read</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td>{new Date(log.createdAt).toLocaleString()}</td>
                      <td>{log.ownerId?.fullName || "—"}</td>
                      <td>
                        <span className="admin-badge">{log.type}</span>
                      </td>
                      <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {log.message}
                      </td>
                      <td>{log.isRead ? "✅" : "❌"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminNotifications;

