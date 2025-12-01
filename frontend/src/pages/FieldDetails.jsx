// src/pages/FieldDetails.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

export default function FieldDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [duration, setDuration] = useState(1);

  useEffect(() => {
    if (!id || id === "undefined") {
      setError("Invalid field ID.");
      setLoading(false);
      return;
    }

    const loadField = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/fields/${id}`);
        const data = await res.json();

        if (!data.field) {
          setError("Field not found.");
        } else {
          setField(data.field);
        }
      } catch (err) {
        console.error("Field load error:", err);
        setError("Failed to load field details.");
      } finally {
        setLoading(false);
      }
    };

    loadField();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <p>Loading field details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <p>{error}</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: 15,
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            background: "#00b44b",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          ⬅ Back
        </button>
      </div>
    );
  }

  if (!field) {
    return (
      <div style={{ padding: 40 }}>
        <p>Field not found.</p>
      </div>
    );
  }

  const {
    name,
    city,
    area,
    address,
    sport,
    pricePerHour,
    currency,
    mainImage,
    images = [],
    description,
    amenities = [],
    rules = [],
    openingHours,
    owner,
    isIndoor,
    surfaceType,
    maxPlayers,
    averageRating,
    reviewCount,
  } = field;

  const totalPrice = pricePerHour * duration;

  return (
    <div style={{ padding: "40px 40px 60px" }}>
      <Link
        to="/discover"
        style={{
          display: "inline-block",
          marginBottom: 20,
          textDecoration: "none",
          color: "#00b44b",
          fontWeight: 600,
        }}
      >
        ⬅ Back to Discover
      </Link>

      {/* TOP: MAIN IMAGE + TITLE */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
          gap: 30,
          alignItems: "flex-start",
        }}
      >
        {/* LEFT: IMAGES + INFO */}
        <div>
          {/* MAIN IMAGE */}
          <img
            src={mainImage}
            alt={name}
            style={{
              width: "100%",
              borderRadius: 20,
              objectFit: "cover",
              maxHeight: 420,
            }}
          />

          {/* GALLERY */}
          {images.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 10,
                marginTop: 12,
              }}
            >
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${name} ${idx + 1}`}
                  style={{
                    width: "100%",
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 10,
                  }}
                />
              ))}
            </div>
          )}

          {/* BASIC INFO */}
          <h1
            style={{
              fontSize: 32,
              marginTop: 20,
              marginBottom: 5,
              fontWeight: 800,
            }}
          >
            {name}
          </h1>

          <p style={{ fontSize: 16, color: "#555", marginBottom: 6 }}>
            {sport && <strong>{sport}</strong>}{" "}
            {city && (
              <>
                · {city}
                {area ? ` - ${area}` : ""}
              </>
            )}
          </p>

          <p style={{ fontSize: 15, color: "#666", marginBottom: 8 }}>
            📍 {address}
          </p>

          {/* RATING + INDOOR/OUTDOOR + SURFACE */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 10,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {averageRating > 0 && (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#fff3cd",
                  border: "1px solid #ffe58f",
                }}
              >
                ⭐ {averageRating.toFixed(1)} ({reviewCount} reviews)
              </span>
            )}

            <span
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                background: "#f0f0f0",
              }}
            >
              {isIndoor ? "Indoor" : "Outdoor"}
            </span>

            {surfaceType && (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#f0f0f0",
                }}
              >
                Surface: {surfaceType}
              </span>
            )}

            {maxPlayers && (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#f0f0f0",
                }}
              >
                Up to {maxPlayers} players
              </span>
            )}
          </div>

          {/* DESCRIPTION */}
          {description && (
            <>
              <h2 style={{ fontSize: 20, marginTop: 10, marginBottom: 8 }}>
                Description
              </h2>
              <p style={{ fontSize: 15, color: "#444", lineHeight: 1.6 }}>
                {description}
              </p>
            </>
          )}

          {/* AMENITIES & RULES */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: 30,
              marginTop: 25,
            }}
          >
            <div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Amenities</h3>
              {amenities && amenities.length > 0 ? (
                <ul style={{ paddingLeft: 18, fontSize: 14, color: "#444" }}>
                  {amenities.map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: 14, color: "#777" }}>
                  No amenities listed.
                </p>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Rules</h3>
              {rules && rules.length > 0 ? (
                <ul style={{ paddingLeft: 18, fontSize: 14, color: "#444" }}>
                  {rules.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: 14, color: "#777" }}>
                  No specific rules listed.
                </p>
              )}
            </div>
          </div>

          {/* OWNER INFO */}
          {owner && (owner.name || owner.phone || owner.email) && (
            <div style={{ marginTop: 30 }}>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Field Owner</h3>
              {owner.name && (
                <p style={{ fontSize: 14, color: "#444" }}>{owner.name}</p>
              )}
              {owner.phone && (
                <p style={{ fontSize: 14, color: "#444" }}>📞 {owner.phone}</p>
              )}
              {owner.email && (
                <p style={{ fontSize: 14, color: "#444" }}>✉️ {owner.email}</p>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: BOOKING CARD */}
        <div>
          <div
            style={{
              borderRadius: 18,
              padding: 20,
              border: "1px solid #e3e3e3",
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              background: "#fff",
              position: "sticky",
              top: 80,
            }}
          >
            <p
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              {currency || "USD"} {pricePerHour} / hour
            </p>

            {openingHours && (
              <p style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>
                Opens: {openingHours.open} · Closes: {openingHours.close}
              </p>
            )}

            {/* DATE */}
            <label
              style={{ display: "block", fontSize: 14, marginBottom: 4 }}
            >
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #ccc",
                marginBottom: 12,
                fontSize: 14,
              }}
            />

            {/* TIME */}
            <label
              style={{ display: "block", fontSize: 14, marginBottom: 4 }}
            >
              Start Time
            </label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #ccc",
                marginBottom: 12,
                fontSize: 14,
              }}
            >
              {[
                "08:00",
                "09:00",
                "10:00",
                "11:00",
                "12:00",
                "13:00",
                "14:00",
                "15:00",
                "16:00",
                "17:00",
                "18:00",
                "19:00",
                "20:00",
                "21:00",
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* DURATION */}
            <label
              style={{ display: "block", fontSize: 14, marginBottom: 4 }}
            >
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #ccc",
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              <option value={1}>1 hour</option>
              <option value={2}>2 hours</option>
              <option value={3}>3 hours</option>
              <option value={4}>4 hours</option>
            </select>

            {/* SUMMARY */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 15,
                marginBottom: 14,
              }}
            >
              <span>
                {pricePerHour} × {duration} h
              </span>
              <strong>
                {currency || "USD"} {totalPrice}
              </strong>
            </div>

            <button
              style={{
                width: "100%",
                padding: "12px 20px",
                background: "#00b44b",
                color: "white",
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Book Now
            </button>

            <p style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
              Real payment integration & availability calendar can be connected
              later (PDR step 2).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
