// src/components/search/FieldCard.jsx
import { memo, useState, useCallback } from "react";
import "./FieldCard.css";
import { Link } from "react-router-dom";

const API_URL = "http://localhost:5000";
const PLACEHOLDER = "/images/placeholder-field.jpg";

// Helper to get proper image URL (stable, no dynamic values)
const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${API_URL}/${img}`;
};

// Custom comparison: only re-render if essential field data changes
const areEqual = (prevProps, nextProps) => {
  const prev = prevProps.field;
  const next = nextProps.field;
  return (
    prev._id === next._id &&
    prev.name === next.name &&
    prev.pricePerHour === next.pricePerHour &&
    prev.mainImage === next.mainImage &&
    prev.averageRating === next.averageRating
  );
};

// Memoized with custom comparison to prevent unnecessary re-renders
const FieldCard = memo(function FieldCard({ field }) {
  const [imgError, setImgError] = useState(false);
  
  const {
    _id,
    name,
    city,
    area,
    sport,
    sportType,
    pricePerHour,
    currency,
    mainImage,
    images,
    averageRating,
    reviewCount,
  } = field;

  // Stable image URL (no recalculation on re-render)
  const rawImage = mainImage || images?.[0];
  const displayImage = imgError ? PLACEHOLDER : (getImageUrl(rawImage) || PLACEHOLDER);
  
  // Build location string (handle missing values)
  const locationParts = [city, area].filter(Boolean);
  const locationStr = locationParts.length > 0 ? locationParts.join(", ") : "Location not set";
  
  // Sport type (handle both field names)
  const displaySport = sportType || sport || "Sport";
  
  // Stable error handler (useCallback prevents new function on each render)
  const handleImgError = useCallback(() => {
    setImgError(true);
  }, []);

  return (
    <div className="field-card">

      {/* IMAGE - stable src to prevent reload */}
      <img
        src={displayImage}
        alt={name}
        className="field-img"
        onError={handleImgError}
        loading="lazy"
      />

      {/* INFO + ACTIONS */}
      <div className="field-info">

        <div className="field-info-left">
          <h3 className="field-name">{name}</h3>

          <p className="field-city">
            {locationStr} · {displaySport}
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
}, areEqual);

export default FieldCard;
