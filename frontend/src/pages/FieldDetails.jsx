// src/pages/FieldDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import "./FieldDetails.css";

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

      const res = await fetch(
        `http://localhost:5000/api/fields/${id}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: reviewRating,
            comment: reviewComment,
            user: "Guest User",
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to add review");

      const updated = await fetch(
        `http://localhost:5000/api/fields/${id}`
      ).then((r) => r.json());

      setField(updated);
      setReviewComment("");
      setReviewRating(5);
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
            src={mainImage || "/images/placeholder-field.jpg"}
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
              <img src={img} />
            </div>
          ))}

          {(!images || images.length === 0) && (
            <div className="field-hero-thumb placeholder">More photos soon</div>
          )}
        </div>
      </div>

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

          {location && (
            <p className="field-location-coords">
              {location.lat}, {location.lng}
            </p>
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
                    <span>{rev.user || "Anonymous"}</span>
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

            <label>
              Rating
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
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
              />
            </label>

            <button
              type="submit"
              disabled={!reviewComment.trim()}
              className="field-review-submit"
            >
              Submit Review
            </button>
          </form>
        </section>

        {/* MAP */}
        <section className="field-section">
          <h2>Location map</h2>
          {location ? (
            <div className="field-map-placeholder">
              Map integration soon <br />
              {location.lat}, {location.lng}
            </div>
          ) : <p>No coordinates yet</p>}
        </section>
      </div>
    </div>
  );
}
