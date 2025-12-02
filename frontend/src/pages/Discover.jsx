// src/pages/Discover.jsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import FieldCard from "../components/search/FieldCard";
import "./Discover.css";

export default function Discover() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ================== STATE ==================
  const [sport, setSport] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(200);

  const [minRating, setMinRating] = useState(0);
  const [indoor, setIndoor] = useState(""); // "", "true", "false"
  const [surfaceType, setSurfaceType] = useState("");
  const [owner, setOwner] = useState("");
  const [amenities, setAmenities] = useState([]);

  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState("list"); // list | map

  // ================== SYNC FROM URL ==================
  useEffect(() => {
    const sSport = searchParams.get("sport") || "";
    const sCity = searchParams.get("city") || "";
    const sDate = searchParams.get("date") || "";
    const sTime = searchParams.get("time") || "";

    const sMin = searchParams.get("min");
    const sMax = searchParams.get("max");

    const sMinRating = searchParams.get("minRating");
    const sIsIndoor = searchParams.get("isIndoor") || "";
    const sSurface = searchParams.get("surfaceType") || "";
    const sOwner = searchParams.get("owner") || "";
    const sSortBy = searchParams.get("sortBy") || "relevance";
    const sView = searchParams.get("view") || "list";

    // amenities from URL (either repeated or comma-separated)
    const amenitiesMulti = searchParams.getAll("amenities");
    let sAmenities = [];
    if (amenitiesMulti.length > 0) {
      sAmenities = amenitiesMulti;
    } else {
      const one = searchParams.get("amenities");
      if (one) {
        sAmenities = one.split(",").map((a) => a.trim()).filter(Boolean);
      }
    }

    setSport(sSport);
    setCity(sCity);
    setDate(sDate);
    setTime(sTime);

    setMinPrice(sMin ? Number(sMin) : 0);
    setMaxPrice(sMax ? Number(sMax) : 200);

    setMinRating(sMinRating ? Number(sMinRating) : 0);
    setIndoor(sIsIndoor);
    setSurfaceType(sSurface);
    setOwner(sOwner);
    setSortBy(sSortBy);
    setViewMode(sView);
    setAmenities(sAmenities);
  }, [searchParams]);

  // ================== FETCH FROM BACKEND ==================
  useEffect(() => {
    const loadFields = async () => {
      try {
        setLoading(true);
        setError("");

        const qs = searchParams.toString();
        const url = qs
          ? `http://localhost:5000/api/fields/search?${qs}`
          : `http://localhost:5000/api/fields/search`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Failed to fetch fields");
        }

        const data = await res.json();
        setFields(Array.isArray(data.fields) ? data.fields : []);
      } catch (err) {
        console.error("Error loading fields:", err);
        setError("Failed to load fields");
        setFields([]);
      } finally {
        setLoading(false);
      }
    };

    loadFields();
  }, [searchParams]);

  // ================== CLIENT-SIDE FILTER + SORT ==================
  const getVisibleFields = () => {
    let result = [...fields];

    // price
    result = result.filter((f) => {
      const p = f.pricePerHour || 0;
      return p >= Number(minPrice || 0) && p <= Number(maxPrice || 100000);
    });

    // rating
    if (minRating > 0) {
      result = result.filter(
        (f) => (f.averageRating || 0) >= Number(minRating)
      );
    }

    // indoor / outdoor
    if (indoor === "true") {
      result = result.filter((f) => f.isIndoor === true);
    } else if (indoor === "false") {
      result = result.filter((f) => f.isIndoor === false);
    }

    // surface
    if (surfaceType) {
      const s = surfaceType.toLowerCase();
      result = result.filter(
        (f) => (f.surfaceType || "").toLowerCase() === s
      );
    }

    // owner
    if (owner) {
      const o = owner.toLowerCase();
      result = result.filter((f) =>
        (f.owner?.name || "").toLowerCase().includes(o)
      );
    }

    // amenities (ALL must exist)
    if (amenities.length > 0) {
      result = result.filter((f) => {
        const fieldAmenities = f.amenities || [];
        return amenities.every((a) => fieldAmenities.includes(a));
      });
    }

    // sort
    if (sortBy === "price_low") {
      result.sort((a, b) => (a.pricePerHour || 0) - (b.pricePerHour || 0));
    } else if (sortBy === "price_high") {
      result.sort((a, b) => (b.pricePerHour || 0) - (a.pricePerHour || 0));
    } else if (sortBy === "rating") {
      result.sort(
        (a, b) => (b.averageRating || 0) - (a.averageRating || 0)
      );
    }
    // relevance = كما رجعت من الباك إند

    return result;
  };

  const visibleFields = getVisibleFields();

  // ================== APPLY FILTERS (UPDATE URL) ==================
  const applyFilters = () => {
    const params = new URLSearchParams();

    if (sport) params.set("sport", sport);
    if (city) params.set("city", city);
    if (date) params.set("date", date);
    if (time) params.set("time", time);

    if (minPrice) params.set("min", String(minPrice));
    if (maxPrice) params.set("max", String(maxPrice));

    if (minRating > 0) params.set("minRating", String(minRating));
    if (indoor) params.set("isIndoor", indoor);
    if (surfaceType) params.set("surfaceType", surfaceType);

    if (amenities.length > 0) {
      // backend يدعم الاثنين: amenities=a,b,c أو amenities=a&amenities=b
      params.set("amenities", amenities.join(","));
    }

    if (owner) params.set("owner", owner);
    if (sortBy) params.set("sortBy", sortBy);
    if (viewMode) params.set("view", viewMode);

    navigate({
      pathname: location.pathname,
      search: params.toString(),
    });
  };

  const toggleAmenity = (name) => {
    setAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  // ================== RENDER ==================
  return (
    <div className="discover-page">
      {/* HEADER TITLE + SEARCH ROW */}
      <div className="discover-header">
        <h1>Discover</h1>
        <p>Find courts across Lebanon</p>

        <div className="discover-search-row">
          <input
            type="text"
            className="discover-search-input"
            placeholder="Search by name, location, or sport..."
            // ممكن نربطه لاحقاً مع q في الـ backend
          />
          <button className="discover-location-btn">Use My Location</button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="discover-layout">
        {/* SIDEBAR */}
        <aside className="filters-sidebar">
          <h3>Filters</h3>

          <div className="filter-block">
            <span className="filter-label">Sport</span>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="filter-select"
            >
              <option value="">All sports</option>
              <option value="Football">Football</option>
              <option value="Basketball">Basketball</option>
              <option value="Padel">Padel</option>
              <option value="Tennis">Tennis</option>
            </select>
          </div>

          <div className="filter-block">
            <span className="filter-label">City</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="filter-select"
            >
              <option value="">All cities</option>
              <option value="Beirut">Beirut</option>
              <option value="Sidon">Sidon</option>
              <option value="Jounieh">Jounieh</option>
              <option value="Tripoli">Tripoli</option>
            </select>
          </div>

          <div className="filter-block">
            <span className="filter-label">Type</span>
            <select
              value={indoor}
              onChange={(e) => setIndoor(e.target.value)}
              className="filter-select"
            >
              <option value="">Indoor & Outdoor</option>
              <option value="true">Indoor</option>
              <option value="false">Outdoor</option>
            </select>
          </div>

          <div className="filter-block">
            <span className="filter-label">Surface</span>
            <select
              value={surfaceType}
              onChange={(e) => setSurfaceType(e.target.value)}
              className="filter-select"
            >
              <option value="">Any surface</option>
              <option value="Turf">Turf</option>
              <option value="Grass">Grass</option>
              <option value="Hardwood">Hardwood</option>
            </select>
          </div>

          <div className="filter-block">
            <span className="filter-label">Amenities</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {["Parking", "Lights", "Showers", "Lockers", "AC"].map((a) => (
                <label key={a} style={{ fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={amenities.includes(a)}
                    onChange={() => toggleAmenity(a)}
                    style={{ marginRight: 6 }}
                  />
                  {a}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-block">
            <span className="filter-label">Field Owner</span>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Owner name..."
              className="filter-input"
            />
          </div>

          <div className="filter-block">
            <span className="filter-label">Availability Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="filter-input"
            />
            <small className="filter-hint">
              Availability logic can be added later in bookings module.
            </small>
          </div>

          <div className="filter-block">
            <span className="filter-label">Price per Hour</span>
            <div className="price-range-row">
              <span>${minPrice || 0}</span>
              <input
                type="range"
                min="0"
                max="200"
                step="5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="filter-range"
              />
              <span>${maxPrice}</span>
            </div>
          </div>

          <div className="filter-block">
            <span className="filter-label">Minimum Rating</span>
            <div className="price-range-row">
              <span>{minRating > 0 ? `${minRating}+` : "Any"}</span>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="filter-range"
              />
              <span>5.0</span>
            </div>
          </div>

          <button className="filters-apply-btn" onClick={applyFilters}>
            Apply Filters
          </button>
        </aside>

        {/* RESULTS */}
        <section className="discover-results">
          <div className="results-top-row">
            <div className="results-count">
              {loading
                ? "Loading..."
                : `${visibleFields.length} results found`}
              {date && (
                <span className="results-date">
                  &nbsp;· for <strong>{date}</strong>
                  {time && (
                    <>
                      {" "}
                      at <strong>{time}</strong>
                    </>
                  )}
                </span>
              )}
            </div>

            <div className="results-actions">
              <div className="view-switch">
                <button
                  className={
                    viewMode === "list"
                      ? "view-switch-btn active"
                      : "view-switch-btn"
                  }
                  onClick={() => setViewMode("list")}
                >
                  List
                </button>
                <button
                  className={
                    viewMode === "map"
                      ? "view-switch-btn active"
                      : "view-switch-btn"
                  }
                  onClick={() => setViewMode("map")}
                >
                  Map
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="relevance">Sorted by Relevance</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          {viewMode === "map" ? (
            <div className="map-placeholder">
              <p>🗺 Map view (to be connected later with Google Maps).</p>
            </div>
          ) : loading ? (
            <p>Loading...</p>
          ) : visibleFields.length === 0 ? (
            <p>No courts found.</p>
          ) : (
            <div className="results-list">
              {visibleFields.map((field, index) => (
                <div key={field._id} className="court-row">
                  <FieldCard field={field} />
                  <details className="ranking-details">
                    <summary>
                      Why is "{field.name}" ranked #{index + 1}?
                    </summary>
                    <p>
                      This court is ranked based on a combination of{" "}
                      <strong>rating</strong>, <strong>price</strong>, and{" "}
                      <strong>amenities</strong>. Fields with higher rating,
                      more amenities (like lights, parking, showers), and fair
                      price per hour appear higher in the list.
                    </p>
                  </details>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
