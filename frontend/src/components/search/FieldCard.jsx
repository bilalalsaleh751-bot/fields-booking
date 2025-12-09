// src/components/search/FieldCard.jsx
import "./FieldCard.css";
import { Link } from "react-router-dom";

export default function FieldCard({ field }) {
  const {
    _id,
    name,
    city,
    sport,
    pricePerHour,
    currency,
    mainImage,
    averageRating,
    reviewCount,
  } = field;

  return (
    <div className="field-card">

      {/* IMAGE */}
      <img
        src={mainImage || "/images/placeholder-field.jpg"}
        alt={name}
        className="field-img"
      />

      {/* INFO + ACTIONS */}
      <div className="field-info">

        <div className="field-info-left">
          <h3 className="field-name">{name}</h3>

          <p className="field-city">
            {city} · {sport}
          </p>

          <p className="field-price">
            {currency || "USD"} {pricePerHour} / hour
          </p>

          {averageRating > 0 && (
            <p className="field-rating">
              ⭐ {averageRating.toFixed(1)}{" "}
              <span className="field-rating-count">
                ({reviewCount} reviews)
              </span>
            </p>
          )}

          <Link
            to={`/field/${_id}`}
            className="field-details-btn"
          >
            View Details →
          </Link>
        </div>

        {/* RIGHT SIDE – BOOK NOW BUTTON */}
        <div className="field-info-right">
          <Link
            to={`/booking/${_id}`}
            className="book-now-btn"
          >
            Book Now
          </Link>
        </div>

      </div>
    </div>
  );
}
