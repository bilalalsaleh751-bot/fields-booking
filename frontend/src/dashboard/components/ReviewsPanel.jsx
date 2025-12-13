// src/dashboard/components/ReviewsPanel.jsx
import { useNavigate } from "react-router-dom";

function ReviewsPanel({ reviews = [] }) {
  const navigate = useNavigate();
  
  const handleViewAll = () => {
    navigate("/owner/reviews");
  };

  const renderStars = (count) =>
    "★".repeat(count) + "☆".repeat(5 - count);

  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-header">
        <div>
          <h2 className="dashboard-panel-title">Latest Reviews</h2>
          <p className="dashboard-panel-subtitle">
            See what players say and reply to keep your rating high.
          </p>
        </div>
        <button className="dashboard-date-pill" onClick={handleViewAll}>
          View all
        </button>
      </div>

      {reviews.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>No reviews yet.</p>
        </div>
      ) : (
        <div>
          {reviews.map((r, idx) => (
            <div key={idx} className="review-item">
              <div className="review-header">
                <span className="review-name">{r.userName}</span>
                <span className="review-rating">
                  {renderStars(r.rating)} ({r.rating}.0)
                </span>
              </div>

              <div className="review-text">{r.comment}</div>

              <div className="review-field">
                {r.fieldName} • {new Date(r.createdAt).toLocaleDateString("en-US", { 
                  month: "short", 
                  day: "numeric", 
                  year: "numeric" 
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ReviewsPanel;
