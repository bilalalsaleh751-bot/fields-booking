// src/dashboard/pages/OwnerReviews.jsx
import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import "../dashboard.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";


function OwnerReviews() {
  const location = useLocation();
  
  const [ownerName, setOwnerName] = useState("");
  const [ownerId, setOwnerId] = useState("");

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("ownerName");
    const storedId = localStorage.getItem("ownerId");

    if (storedName) setOwnerName(storedName);
    if (storedId) setOwnerId(storedId);
  }, []);

  const fetchReviews = useCallback(async () => {
    if (!ownerId) return;
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/api/owner/reviews?ownerId=${ownerId}`
      );
      const data = await res.json();
      if (res.ok) setReviews(data.reviews || []);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  // Fetch reviews on mount and when navigating back
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews, location.key]);

  const getToken = () => {
    return localStorage.getItem("ownerToken") || "";
  };

  const handleRespond = async (fieldId, userName, rating, comment, createdAt) => {
    if (!responseText.trim()) {
      alert("Please enter a response");
      return;
    }

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/owner/reviews/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ownerId,
          fieldId,
          userName,
          rating,
          comment,
          createdAt,
          response: responseText,
        }),
      });

      if (res.ok) {
        setRespondingTo(null);
        setResponseText("");
        fetchReviews();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to add response");
      }
    } catch (err) {
      console.error("Response error:", err);
      alert("Error adding response");
    }
  };

  const renderStars = (count) => {
    return "★".repeat(count) + "☆".repeat(5 - count);
  };

  return (
    <>
      <DashboardHeader ownerName={ownerName} />

      <div style={{ padding: 0 }}>
        <div className="dashboard-panel" style={{ marginBottom: 24 }}>
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Reviews</h2>
              <p className="dashboard-panel-subtitle">
                View and respond to customer reviews
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="dashboard-panel">
            <p className="dashboard-loading">Loading reviews…</p>
          </div>
        )}

        {!loading && reviews.length === 0 && (
          <div className="dashboard-panel">
            <p className="dashboard-empty">No reviews yet.</p>
          </div>
        )}

        {!loading && reviews.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {reviews.map((r, idx) => (
              <div key={idx} className="dashboard-panel" style={{ margin: 0 }}>
                <div className="review-item" style={{ border: "none", padding: 0 }}>
                  <div className="review-header">
                    <div>
                      <span className="review-name">{r.userName}</span>
                      <span
                        style={{
                          marginLeft: 12,
                          fontSize: 13,
                          color: "#64748b",
                        }}
                      >
                        {r.fieldName}
                      </span>
                    </div>
                    <span className="review-rating">
                      {renderStars(r.rating)} ({r.rating}.0)
                    </span>
                  </div>

                  <div className="review-text">{r.comment}</div>

                  <div className="review-field">
                    {new Date(r.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>

                  {r.response ? (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 12,
                        background: "#f8fafc",
                        borderRadius: 8,
                        borderLeft: "3px solid #22c55e",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#22c55e",
                          marginBottom: 4,
                        }}
                      >
                        Your Response
                      </div>
                      <div style={{ fontSize: 13, color: "#475569" }}>
                        {r.response}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 12 }}>
                      {respondingTo === idx ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <textarea
                            placeholder="Write your response..."
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            rows={3}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              border: "1px solid #e2e8f0",
                              fontSize: "13px",
                              fontFamily: "inherit",
                              resize: "vertical",
                              outline: "none",
                            }}
                          />
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => handleRespond(r.fieldId, r.userName, r.rating, r.comment, r.createdAt)}
                              className="dashboard-primary-btn"
                              style={{ fontSize: 12, padding: "8px 16px" }}
                            >
                              Submit Response
                            </button>
                            <button
                              onClick={() => {
                                setRespondingTo(null);
                                setResponseText("");
                              }}
                              className="dashboard-date-pill"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRespondingTo(idx)}
                          className="dashboard-date-pill"
                          style={{ fontSize: 12 }}
                        >
                          Respond to Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default OwnerReviews;

