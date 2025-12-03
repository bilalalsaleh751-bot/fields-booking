// src/pages/FieldDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import "./FieldDetails.css";

export default function FieldDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Booking form state (PDR step 1 – UI only)
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get("date") || ""
  );
  const [selectedTime, setSelectedTime] = useState(
    searchParams.get("time") || ""
  );
  const [duration, setDuration] = useState("1");
  const [playersCount, setPlayersCount] = useState("10");
  const [note, setNote] = useState("");

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Load field details
  useEffect(() => {
    const loadField = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`http://localhost:5000/api/fields/${id}`);
        if (!res.ok) {
          throw new Error("Failed to load field details");
        }
        const data = await res.json();
        setField(data);
      } catch (err) {
        console.error("Error loading field:", err);
        setError("Failed to load field details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadField();
    }
  }, [id]);

  const handleBackToDiscover = () => {
    // لو جاي من Discover مع فلاتر، منترك الـ URL كما هو
    const fromDiscover = searchParams.get("from") === "discover";
    if (fromDiscover) {
      navigate(-1);
    } else {
      navigate("/discover");
    }
  };

  const handleSubmitBooking = (e) => {
    e.preventDefault();
    // PDR step 1: UI only – no real booking logic yet
    alert(
      `Booking request (PDR UI only):\n\nField: ${
        field?.name
      }\nDate: ${selectedDate || "-"}\nTime: ${
        selectedTime || "-"
      }\nDuration: ${duration} hour(s)\nPlayers: ${
        playersCount || "-"
      }\n\nReal booking API & payments will be connected in the next phase.`
    );
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
            user: "Guest User", // لاحقاً نربطه مع حساب المستخدم
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to add review");
      }

      // بعد إضافة الريفيو نرجّع نحمّل الحقل لنحدّث averageRating + reviews
      const updated = await fetch(
        `http://localhost:5000/api/fields/${id}`
      ).then((r) => r.json());
      setField(updated);
      setReviewComment("");
      setReviewRating(5);
    } catch (err) {
      console.error("Error adding review:", err);
      alert("Error adding review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="field-page">
        <p>Loading field details...</p>
      </div>
    );
  }

  if (error || !field) {
    return (
      <div className="field-page">
        <p
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "10px 12px",
            borderRadius: 8,
            fontSize: 14,
            marginBottom: 8,
          }}
        >
          {error || "Field not found."}
        </p>
        <button
          onClick={handleBackToDiscover}
          style={{
            padding: "8px 16px",
            borderRadius: 999,
            border: "1px solid #d1d5db",
            background: "#fff",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ← Back to Discover
        </button>
      </div>
    );
  }

  const {
    name,
    sport,
    city,
    area,
    address,
    description,
    mainImage,
    images,
    pricePerHour,
    currency,
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

  const displayCurrency = currency || "USD";
  const displayPrice = pricePerHour || 0;
  const isIndoorText =
    isIndoor === true ? "Indoor" : isIndoor === false ? "Outdoor" : "Indoor / Outdoor";
  const durationNum = Number(duration) || 1;
  const totalPrice = displayPrice * durationNum;

  return (
    <div className="field-page">
      {/* BACK + BREADCRUMB */}
      <div className="field-top-bar">
        <button className="field-back-btn" onClick={handleBackToDiscover}>
          ← Back to Discover
        </button>
        <div className="field-breadcrumb">
          {sport && <span>{sport}</span>}
          {city && (
            <>
              <span>·</span>
              <span>{city}</span>
            </>
          )}
          {area && (
            <>
              <span>·</span>
              <span>{area}</span>
            </>
          )}
        </div>
      </div>

      {/* HERO IMAGES SECTION */}
      <div className="field-hero">
        <div className="field-hero-main">
          <img
            src={mainImage || "/images/placeholder-field.jpg"}
            alt={name}
            className="field-hero-main-img"
          />
          <div className="field-hero-overlay">
            <div className="field-hero-title">
              <h1>{name}</h1>
              <p>
                {city}
                {area ? ` · ${area}` : ""} · {sport} · {isIndoorText}
              </p>
            </div>
            <div className="field-hero-rating">
              <span className="field-rating-score">
                {averageRating ? averageRating.toFixed(1) : "New"}
              </span>
              <span className="field-rating-count">
                {reviewCount && reviewCount > 0
                  ? `${reviewCount} review${reviewCount > 1 ? "s" : ""}`
                  : "No reviews yet"}
              </span>
            </div>
          </div>
        </div>

        {/* side images */}
        <div className="field-hero-gallery">
          {(images || []).slice(0, 3).map((img, idx) => (
            <div key={idx} className="field-hero-thumb">
              <img src={img} alt={`${name} ${idx + 1}`} />
            </div>
          ))}
          {(!images || images.length === 0) && (
            <div className="field-hero-thumb placeholder">
              <span>More photos coming soon</span>
            </div>
          )}
        </div>
      </div>

      {/* MAIN LAYOUT: INFO + BOOKING SIDEBAR */}
      <div className="field-main-layout">
        {/* LEFT COLUMN */}
        <div className="field-main-left">
          {/* DESCRIPTION + BASIC INFO */}
          <section className="field-section">
            <h2>About this field</h2>
            <p className="field-description">
              {description ||
                "No description has been provided yet. Field owner can update this section from the dashboard."}
            </p>

            <div className="field-tags-row">
              {sport && <span className="field-tag">{sport}</span>}
              {surfaceType && (
                <span className="field-tag">
                  Surface: <strong>{surfaceType}</strong>
                </span>
              )}
              {isIndoor !== undefined && (
                <span className="field-tag">
                  Type: <strong>{isIndoorText}</strong>
                </span>
              )}
              {maxPlayers && (
                <span className="field-tag">
                  Max players: <strong>{maxPlayers}</strong>
                </span>
              )}
            </div>

            <div className="field-address">
              <h3>Location</h3>
              <p>
                {address ||
                  `${city || ""}${area ? `, ${area}` : ""}`.trim() ||
                  "Location details not specified yet."}
              </p>
              {location && typeof location.lat === "number" && typeof location.lng === "number" && (
                <p className="field-location-coords">
                  Coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              )}
            </div>
          </section>

          {/* OPENING HOURS + AMENITIES + RULES */}
          <section className="field-section">
            <div className="field-section-grid">
              <div>
                <h3>Opening hours</h3>
                {openingHours && (openingHours.open || openingHours.close) ? (
                  <p>
                    {openingHours.open || "??:??"} – {openingHours.close || "??:??"}
                  </p>
                ) : (
                  <p>Opening hours not set yet.</p>
                )}
              </div>

              <div>
                <h3>Amenities</h3>
                {amenities && amenities.length > 0 ? (
                  <ul className="field-list">
                    {amenities.map((a, idx) => (
                      <li key={idx}>{a}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No amenities listed yet.</p>
                )}
              </div>

              <div>
                <h3>Rules</h3>
                {rules && rules.length > 0 ? (
                  <ul className="field-list">
                    {rules.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No rules have been added yet.</p>
                )}
              </div>
            </div>
          </section>

          {/* OWNER INFO */}
          <section className="field-section">
            <h3>Field owner</h3>
            {owner ? (
              <div className="field-owner-card">
                <p className="field-owner-name">{owner.name}</p>
                <p className="field-owner-contact">
                  {owner.phone && <span>📞 {owner.phone}</span>}
                  {owner.email && (
                    <span style={{ marginLeft: 12 }}>✉️ {owner.email}</span>
                  )}
                </p>
                <p className="field-owner-hint">
                  For any questions about availability or special events, you
                  can contact the owner directly.
                </p>
              </div>
            ) : (
              <p>No owner information available yet.</p>
            )}
          </section>

          {/* REVIEWS */}
          <section className="field-section">
            <h2>Reviews</h2>

            {reviews && reviews.length > 0 ? (
              <div className="field-reviews-list">
                {reviews.map((rev, idx) => (
                  <div key={idx} className="field-review-card">
                    <div className="field-review-header">
                      <span className="field-review-user">
                        {rev.user || "Anonymous"}
                      </span>
                      <span className="field-review-rating">
                        {rev.rating ? rev.rating.toFixed(1) : "-"} ★
                      </span>
                    </div>
                    {rev.comment && (
                      <p className="field-review-comment">{rev.comment}</p>
                    )}
                    {rev.createdAt && (
                      <p className="field-review-date">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No reviews yet. Be the first to review this field.</p>
            )}

            {/* ADD REVIEW FORM */}
            <form className="field-review-form" onSubmit={handleAddReview}>
              <h4>Add your review</h4>
              <div className="field-review-form-row">
                <label>
                  Rating
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                  >
                    {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map((r) => (
                      <option key={r} value={r}>
                        {r} ★
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="field-review-form-row">
                <label>
                  Comment
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience about this field..."
                    rows={3}
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={submittingReview || !reviewComment.trim()}
                className="field-review-submit"
              >
                {submittingReview ? "Submitting..." : "Submit review"}
              </button>
              <p className="field-review-note">
                Reviews update the average rating and help other players choose
                better.
              </p>
            </form>
          </section>

          {/* MAP PLACEHOLDER */}
          <section className="field-section">
            <h2>Location map</h2>
            {location && typeof location.lat === "number" && typeof location.lng === "number" ? (
              <div className="field-map-placeholder">
                <p>
                  🗺 Map integration (Google Maps / Leaflet) can be connected
                  here in the next step.
                </p>
                <p>
                  Current coordinates: <strong>{location.lat}</strong>,{" "}
                  <strong>{location.lng}</strong>
                </p>
              </div>
            ) : (
              <p>Map will be available once coordinates are added.</p>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN – BOOKING CARD */}
        <aside className="field-main-right">
          <div className="field-booking-card">
            <div className="field-price-row">
              <span className="field-price-main">
                {displayCurrency} {displayPrice}
              </span>
              <span className="field-price-sub">per hour</span>
            </div>

            {averageRating ? (
              <div className="field-booking-rating">
                <span>{averageRating.toFixed(1)} ★</span>
                <span>
                  {reviewCount} review{reviewCount === 1 ? "" : "s"}
                </span>
              </div>
            ) : (
              <div className="field-booking-rating">
                <span>New field</span>
                <span>No reviews yet</span>
              </div>
            )}

            <form className="field-booking-form" onSubmit={handleSubmitBooking}>
              <label className="field-booking-label">
                Date
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </label>

              <label className="field-booking-label">
                Start time
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </label>

              <label className="field-booking-label">
                Duration
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="1">1 hour</option>
                  <option value="1.5">1.5 hours</option>
                  <option value="2">2 hours</option>
                  <option value="3">3 hours</option>
                  <option value="4">4 hours</option>
                </select>
              </label>

              <label className="field-booking-label">
                Number of players
                <select
                  value={playersCount}
                  onChange={(e) => setPlayersCount(e.target.value)}
                >
                  <option value="8">8 players</option>
                  <option value="10">10 players</option>
                  <option value="12">12 players</option>
                  <option value="14">14 players</option>
                  <option value="16">16 players</option>
                </select>
              </label>

              <label className="field-booking-label">
                Note to owner (optional)
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex: We need extra balls or bibs..."
                />
              </label>

              <div className="field-booking-summary">
                <span>Total price</span>
                <span>
                  {displayCurrency} {totalPrice.toFixed(2)}
                </span>
              </div>

              <button type="submit" className="field-book-btn">
                Book Now
              </button>

              <p className="field-booking-hint">
                Real payment integration & availability calendar can be
                connected later (PDR step 2).
              </p>
            </form>
          </div>

          <div className="field-safety-box">
            <h4>Booking & safety</h4>
            <ul>
              <li>Payments and real-time availability will be added next.</li>
              <li>Owner can block maintenance hours from their dashboard.</li>
              <li>Platform admin can monitor disputes and refunds.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
