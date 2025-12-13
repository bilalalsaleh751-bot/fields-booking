// src/pages/FieldDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import MapDisplay from "../components/MapDisplay";
import "./FieldDetails.css";

const API_URL = "http://localhost:5000";

// Helper to get proper image URL
const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${API_URL}/${img}`;
};

export default function FieldDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    const loadField = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`http://localhost:5000/api/fields/${id}`);
        if (!res.ok) throw new Error("Failed to load field details");

        const data = await res.json();
        setField(data);
      } catch (err) {
        setError("Failed to load field details");
      } finally {
        setLoading(false);
      }
    };
    loadField();
  }, [id]);

  const handleBackToDiscover = () => {
    const fromDiscover = searchParams.get("from") === "discover";
    if (fromDiscover) navigate(-1);
    else navigate("/discover");
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    try {
      setSubmittingReview(true);
      setReviewError("");
      setReviewSuccess(false);

      const res = await fetch(
        `http://localhost:5000/api/fields/${id}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: reviewRating,
            comment: reviewComment,
            userName: "Guest User", // Use userName to match schema
          }),
        }
      );

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to add review");
      }

      // Re-fetch field to get updated reviews list
      const updated = await fetch(
        `http://localhost:5000/api/fields/${id}`
      ).then((r) => r.json());

      setField(updated);
      setReviewComment("");
      setReviewRating(5);
      setReviewSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      setReviewError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="field-page"><p>Loading field...</p></div>;
  if (error || !field)
    return (
      <div className="field-page">
        <p className="error-box">{error || "Field not found."}</p>
        <button className="field-back-btn" onClick={handleBackToDiscover}>← Back</button>
      </div>
    );

  const {
    name,
    sport,
    city,
    area,
    address,
    description,
    mainImage,
    images,
    isIndoor,
    surfaceType,
    maxPlayers,
    amenities,
    rules,
    openingHours,
    owner,
    location,
    averageRating,
    reviewCount,
    reviews,
  } = field;

  const isIndoorText =
    isIndoor === true ? "Indoor" : isIndoor === false ? "Outdoor" : "Indoor / Outdoor";

  return (
    <div className="field-page">
      {/* TOP BAR */}
      <div className="field-top-bar">
        <button className="field-back-btn" onClick={handleBackToDiscover}>
          ← Back to Discover
        </button>

        {/* BOOK NOW BUTTON */}
        <Link to={`/booking/${id}`} className="field-details-book-btn">
          Book Now
        </Link>

        <div className="field-breadcrumb">
          {sport && <span>{sport}</span>}
          {city && <span>· {city}</span>}
          {area && <span>· {area}</span>}
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="field-hero">
        <div className="field-hero-main">
          <img
            src={getImageUrl(mainImage) || "/images/placeholder-field.jpg"}
            alt={name}
            className="field-hero-main-img"
          />

          <div className="field-hero-overlay">
            <h1>{name}</h1>
            <p>{city}{area && ` · ${area}`} · {sport} · {isIndoorText}</p>

            <div className="field-hero-rating">
              <span className="field-rating-score">
                {averageRating ? averageRating.toFixed(1) : "New"}
              </span>
              <span className="field-rating-count">
                {reviewCount ? `${reviewCount} reviews` : "No reviews yet"}
              </span>
            </div>
          </div>
        </div>

        {/* SIDE IMAGES */}
        <div className="field-hero-gallery">
          {(images || []).slice(0, 3).map((img, i) => (
            <div key={i} className="field-hero-thumb">
              <img src={getImageUrl(img)} alt={`${name} - ${i + 1}`} />
            </div>
          ))}

          {(!images || images.length === 0) && (
            <div className="field-hero-thumb placeholder">More photos soon</div>
          )}
        </div>
      </div>

      {/* FULL IMAGE GALLERY (if more than 3 images) */}
      {images && images.length > 3 && (
        <section className="field-gallery-full">
          <h3>All Photos ({images.length})</h3>
          <div className="field-gallery-grid">
            {images.map((img, i) => (
              <div key={i} className="field-gallery-item">
                <img src={getImageUrl(img)} alt={`${name} - ${i + 1}`} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CONTENT */}
      <div className="field-main-left">
        {/* ABOUT */}
        <section className="field-section">
          <h2>About this field</h2>
          <p className="field-description">
            {description || "No description available."}
          </p>

          <div className="field-tags-row">
            {sport && <span className="field-tag">{sport}</span>}
            {surfaceType && <span className="field-tag">Surface: {surfaceType}</span>}
            {isIndoor && <span className="field-tag">Type: {isIndoorText}</span>}
            {maxPlayers && <span className="field-tag">Max players: {maxPlayers}</span>}
          </div>

          <h3>Location</h3>
          <p>{address || city}</p>

          {location && location.lat && location.lng && (
            <>
              <p className="field-location-coords">
                {location.lat}, {location.lng}
              </p>
              <MapDisplay lat={parseFloat(location.lat)} lng={parseFloat(location.lng)} name={name} />
            </>
          )}
        </section>

        {/* HOURS / AMENITIES / RULES */}
        <section className="field-section">
          <div className="field-section-grid">
            <div>
              <h3>Opening hours</h3>
              {openingHours ? (
                <p>{openingHours.open} – {openingHours.close}</p>
              ) : <p>Not set</p>}
            </div>

            <div>
              <h3>Amenities</h3>
              <ul>{(amenities || []).map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>

            <div>
              <h3>Rules</h3>
              <ul>{(rules || []).map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          </div>
        </section>

        {/* OWNER */}
        <section className="field-section">
          <h3>Field owner</h3>
          {owner ? (
            <div className="field-owner-card">
              <p className="field-owner-name">{owner.name}</p>
              <p className="field-owner-contact">
                {owner.phone && <span>📞 {owner.phone}</span>}
                {owner.email && <span> ✉️ {owner.email}</span>}
              </p>
            </div>
          ) : <p>No owner info</p>}
        </section>

        {/* REVIEWS */}
        <section className="field-section">
          <h2>Reviews</h2>

          {(reviews || []).length > 0 ? (
            <div className="field-reviews-list">
              {reviews.map((rev, i) => (
                <div key={i} className="field-review-card">
                  <div className="field-review-header">
                    <span>{rev.userName || rev.user || "Anonymous"}</span>
                    <span>{rev.rating} ★</span>
                  </div>
                  <p>{rev.comment}</p>
                  {rev.createdAt && (
                    <p className="field-review-date">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : <p>No reviews yet</p>}

          {/* ADD REVIEW */}
          <form className="field-review-form" onSubmit={handleAddReview}>
            <h4>Add Review</h4>

            {reviewSuccess && (
              <div style={{
                padding: "10px 14px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 8,
                color: "#15803d",
                fontSize: 13,
                marginBottom: 12,
              }}>
                ✓ Review submitted successfully!
              </div>
            )}
            
            {reviewError && (
              <div style={{
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                color: "#dc2626",
                fontSize: 13,
                marginBottom: 12,
              }}>
                {reviewError}
              </div>
            )}

            <label>
              Rating
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                disabled={submittingReview}
              >
                {[5,4,3,2,1].map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>

            <label>
              Comment
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                disabled={submittingReview}
                placeholder="Share your experience..."
              />
            </label>

            <button
              type="submit"
              disabled={!reviewComment.trim() || submittingReview}
              className="field-review-submit"
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
