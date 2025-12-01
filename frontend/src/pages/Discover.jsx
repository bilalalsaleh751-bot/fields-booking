// src/pages/Discover.jsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import FieldCard from "../components/search/FieldCard";
import "./Discover.css";

export default function Discover() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Values جايين من الهوم (search bar)
  const sportFromUrl = searchParams.get("sport") || "";
  const cityFromUrl = searchParams.get("city") || "";
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";
  const minFromUrl = searchParams.get("min") || "";
  const maxFromUrl = searchParams.get("max") || "";

  // Sidebar filters (state داخلي للصفحة)
  const [sport, setSport] = useState(sportFromUrl);
  const [city, setCity] = useState(cityFromUrl);
  const [minPrice, setMinPrice] = useState(minFromUrl || 0);
  const [maxPrice, setMaxPrice] = useState(maxFromUrl || 200);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState("list"); // list | map

  // تحميل الملاعب من الـ backend
  useEffect(() => {
    const loadFields = async () => {
      try {
        const params = new URLSearchParams({
          sport: sportFromUrl,
          city: cityFromUrl,
          min: minFromUrl,
          max: maxFromUrl,
        });

        const res = await fetch(
          `http://localhost:5000/api/fields/search?${params.toString()}`
        );

        const data = await res.json();
        setFields(data.fields || []);
      } catch (err) {
        console.error("Error loading fields:", err);
      } finally {
        setLoading(false);
      }
    };

    loadFields();
  }, [sportFromUrl, cityFromUrl, minFromUrl, maxFromUrl]);

  // تطبيق الفلترة والترتيب على النتائج
  const getVisibleFields = () => {
    let result = [...fields];

    // فلترة بالسعر
    result = result.filter((f) => {
      const p = f.pricePerHour || 0;
      return p >= Number(minPrice || 0) && p <= Number(maxPrice || 100000);
    });

    // فلترة بالرّيتينغ
    if (minRating > 0) {
      result = result.filter(
        (f) => (f.averageRating || 0) >= Number(minRating)
      );
    }

    // Sorting
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.pricePerHour - a.pricePerHour);
    } else if (sortBy === "rating-desc") {
      result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }
    // "relevance" => خليهم مثل ما راجعين من الـ backend

    return result;
  };

  const visibleFields = getVisibleFields();

  // تحديث الـ URL لما نضغط Apply Filters (مثل SportLB)
  const applyFilters = () => {
    const params = new URLSearchParams({
      sport,
      city,
      min: minPrice,
      max: maxPrice,
      date,
      time,
    });

    navigate(`/discover?${params.toString()}`);
  };

  return (
    <div className="discover-page">
      {/* HEADER TITLE */}
      <div className="discover-header">
        <h1>Discover</h1>
        <p>Find courts across Lebanon</p>

        {/* Search bar مثل SportLB (بس لسا بدون backend للبحث النصي) */}
        <div className="discover-search-row">
          <input
            type="text"
            className="discover-search-input"
            placeholder="Search by name, location, or sport..."
            // (ممكن لاحقاً نربطه مع /search بالاسم)
          />
          <button className="discover-location-btn">Use My Location</button>
        </div>
      </div>

      {/* MAIN LAYOUT: sidebar + content */}
      <div className="discover-layout">
        {/* ================= SIDEBAR FILTERS ================= */}
        <aside className="filters-sidebar">
          <h3>Filters</h3>

          {/* Sport */}
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

          {/* City */}
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

          {/* Availability Date (PDR فقط — بدون backend حقيقي للساعة) */}
          <div className="filter-block">
            <span className="filter-label">Availability Date</span>
            <input
              type="date"
              value={date}
              onChange={() => {}}
              className="filter-input"
            />
            <small className="filter-hint">
              Availability logic can be added later in bookings module.
            </small>
          </div>

          {/* Price slider */}
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
                onChange={(e) => setMaxPrice(e.target.value)}
                className="filter-range"
              />
              <span>${maxPrice}</span>
            </div>
          </div>

          {/* Rating slider */}
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
                onChange={(e) => setMinRating(e.target.value)}
                className="filter-range"
              />
              <span>5.0</span>
            </div>
          </div>

          {/* Apply filters button */}
          <button className="filters-apply-btn" onClick={applyFilters}>
            Apply Filters
          </button>
        </aside>

        {/* ================= RESULTS + SORT + MAP/LIST ================= */}
        <section className="discover-results">
          {/* Top row: results count + sort + view switch */}
          <div className="results-top-row">
            <div className="results-count">
              {loading
                ? "Loading..."
                : `${visibleFields.length} results found`}
              {date && (
                <span className="results-date">
                  &nbsp;· for <strong>{date}</strong>
                  {time && <> at <strong>{time}</strong></>}
                </span>
              )}
            </div>

            <div className="results-actions">
              {/* View switch */}
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

              {/* Sorting */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="relevance">Sorted by Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating-desc">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* MAIN CONTENT: LIST or MAP */}
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

                  {/* Ranking Q&A section مثل SportLB */}
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
