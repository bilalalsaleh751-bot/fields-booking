// src/pages/Discover.jsx
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import FieldCard from "../components/search/FieldCard";
import "./Discover.css";

// Leaflet CSS (loaded once)
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

// Lebanon center coordinates
const DEFAULT_CENTER = { lat: 33.8938, lng: 35.5018 };
const DEFAULT_ZOOM = 9;

export default function Discover() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const locationHook = useLocation();
  
  // STABLE string representation of searchParams (prevents re-render loops)
  const searchParamsString = searchParams.toString();

  // ================== STATE ==================
  const [searchQuery, setSearchQuery] = useState("");
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
  
  // User location state
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  // Stable amenities string for useMemo dependency
  const amenitiesKey = amenities.join(",");
  
  // Map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  
  // Track if map is ready (Leaflet loaded + map initialized)
  const [mapReady, setMapReady] = useState(false);

  // ================== SYNC FROM URL (uses stable string dependency) ==================
  useEffect(() => {
    const sQuery = searchParams.get("q") || "";
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

    setSearchQuery(sQuery);
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
  }, [searchParamsString]);

  // ================== FETCH FROM BACKEND (uses stable string dependency) ==================
  useEffect(() => {
    let isCancelled = false;
    
    const loadFields = async () => {
      try {
        setLoading(true);
        setError("");

        const url = searchParamsString
          ? `http://localhost:5000/api/fields/search?${searchParamsString}`
          : `http://localhost:5000/api/fields/search`;

        const res = await fetch(url);
        
        // Don't update state if component unmounted or effect re-ran
        if (isCancelled) return;
        
        if (!res.ok) {
          throw new Error("Failed to fetch fields");
        }

        const data = await res.json();
        
        // Double-check before setting state
        if (!isCancelled) {
          setFields(Array.isArray(data.fields) ? data.fields : []);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setError("Failed to load fields");
          setFields([]);
          setLoading(false);
        }
      }
    };

    loadFields();
    
    // Cleanup: mark as cancelled so we don't update state after unmount
    return () => { isCancelled = true; };
  }, [searchParamsString]);

  // ================== CALCULATE DISTANCE FROM USER ==================
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // ================== CLIENT-SIDE FILTER + SORT (MEMOIZED) ==================
  // All filtering happens client-side for instant updates without refresh
  const visibleFields = useMemo(() => {
    let result = [...fields];

    // Search query (name, sport, city, area)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((f) => 
        (f.name || "").toLowerCase().includes(q) ||
        (f.sportType || "").toLowerCase().includes(q) ||
        (f.city || "").toLowerCase().includes(q) ||
        (f.area || "").toLowerCase().includes(q)
      );
    }

    // Sport filter (instant)
    if (sport) {
      result = result.filter((f) => 
        (f.sportType || "").toLowerCase() === sport.toLowerCase()
      );
    }

    // City filter (instant)
    if (city) {
      result = result.filter((f) => 
        (f.city || "").toLowerCase() === city.toLowerCase()
      );
    }

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

    // Add distance if user location is available
    if (userLocation) {
      result = result.map(f => {
        if (f.location?.lat && f.location?.lng) {
          const distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            f.location.lat, f.location.lng
          );
          return { ...f, distance };
        }
        return { ...f, distance: null };
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
    } else if (sortBy === "distance" && userLocation) {
      result.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }
    // relevance = as returned from backend

    return result;
  }, [fields, searchQuery, sport, city, minPrice, maxPrice, minRating, indoor, surfaceType, owner, amenitiesKey, sortBy, userLocation, calculateDistance]);

  // ================== LOAD LEAFLET AND INITIALIZE MAP ==================
  useEffect(() => {
    if (viewMode !== "map") {
      // Reset mapReady when leaving map view
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        userMarkerRef.current = null;
        markersRef.current = [];
        setMapReady(false);
      }
      return;
    }
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Already initialized

    // Load Leaflet CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const loadLeaflet = () => {
      return new Promise((resolve) => {
        if (window.L) {
          resolve(window.L);
          return;
        }
        if (!document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
          const script = document.createElement("script");
          script.src = LEAFLET_JS;
          script.onload = () => resolve(window.L);
          document.head.appendChild(script);
        } else {
          // Script is loading, wait for it
          const checkLeaflet = setInterval(() => {
            if (window.L) {
              clearInterval(checkLeaflet);
              resolve(window.L);
            }
          }, 100);
        }
      });
    };

    loadLeaflet().then((L) => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const center = userLocation || DEFAULT_CENTER;
      const map = L.map(mapContainerRef.current).setView(
        [center.lat, center.lng],
        userLocation ? 12 : DEFAULT_ZOOM
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
      
      // Signal that map is ready for markers
      setMapReady(true);
    });

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        userMarkerRef.current = null;
        markersRef.current = [];
        setMapReady(false);
      }
    };
  }, [viewMode]); // Remove userLocation - don't recreate map when location changes

  // ================== UPDATE MAP MARKERS WHEN VISIBLE FIELDS CHANGE ==================
  useEffect(() => {
    // Only run when map is ready
    if (!mapReady) return;
    if (!mapInstanceRef.current) return;
    if (!window.L) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear existing field markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for visible fields with clickable popup
    visibleFields.forEach(field => {
      if (field.location?.lat && field.location?.lng) {
        const popupContent = `
          <div style="min-width:150px;">
            <strong style="font-size:14px;">${field.name}</strong><br/>
            <span style="color:#64748b;">${field.sportType || "Sport"}</span><br/>
            <span style="color:#22c55e;font-weight:600;">$${field.pricePerHour}/hr</span>
            ${field.distance ? `<br/><em style="color:#94a3b8;font-size:12px;">${field.distance.toFixed(1)} km away</em>` : ""}
            <br/>
            <a href="/field/${field._id}" 
               style="display:inline-block;margin-top:8px;padding:6px 12px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;font-size:12px;font-weight:500;">
              View Details
            </a>
          </div>
        `;
        
        const marker = L.marker([field.location.lat, field.location.lng])
          .addTo(map)
          .bindPopup(popupContent);
        markersRef.current.push(marker);
      }
    });

    // Fit bounds to show all markers (only field markers, not user)
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [mapReady, visibleFields]);
  
  // ================== UPDATE USER LOCATION MARKER ==================
  useEffect(() => {
    if (!mapReady) return;
    if (!mapInstanceRef.current) return;
    if (!window.L) return;
    if (!userLocation) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Create or update user location marker
    if (userMarkerRef.current) {
      // Update existing marker position
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      // Create new marker
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: '<div style="width:16px;height:16px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup("Your location");
    }

    // Center map on user location
    map.setView([userLocation.lat, userLocation.lng], 12);
  }, [mapReady, userLocation]);

  // ================== USE MY LOCATION ==================
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationLoading(false);
        
        // Auto-switch to distance sort when location is available
        setSortBy("distance");
        // Map centering is handled by the userLocation effect
      },
      (error) => {
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location unavailable");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out");
            break;
          default:
            setLocationError("Failed to get location");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // ================== APPLY FILTERS (UPDATE URL) ==================
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();

    if (searchQuery) params.set("q", searchQuery);
    if (sport) params.set("sport", sport);
    if (city) params.set("city", city);
    if (date) params.set("date", date);
    if (time) params.set("time", time);

    if (minPrice) params.set("min", String(minPrice));
    if (maxPrice && maxPrice < 200) params.set("max", String(maxPrice));

    if (minRating > 0) params.set("minRating", String(minRating));
    if (indoor) params.set("isIndoor", indoor);
    if (surfaceType) params.set("surfaceType", surfaceType);

    if (amenities.length > 0) {
      params.set("amenities", amenities.join(","));
    }

    if (owner) params.set("owner", owner);
    if (sortBy && sortBy !== "relevance") params.set("sortBy", sortBy);
    if (viewMode && viewMode !== "list") params.set("view", viewMode);

    navigate({
      pathname: locationHook.pathname,
      search: params.toString(),
    });
  }, [searchQuery, sport, city, date, time, minPrice, maxPrice, minRating, indoor, surfaceType, amenities, owner, sortBy, viewMode, navigate, locationHook.pathname]);

  const toggleAmenity = useCallback((name) => {
    setAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  }, []);

  // Handle search input with debounce-like behavior
  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  }, [applyFilters]);

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <button 
            className="discover-location-btn"
            onClick={handleUseMyLocation}
            disabled={locationLoading}
          >
            {locationLoading ? "Locating..." : userLocation ? "📍 Near Me" : "Use My Location"}
          </button>
        </div>
        {locationError && (
          <p style={{ color: "#dc2626", fontSize: 13, marginTop: 4 }}>{locationError}</p>
        )}
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
                {userLocation && <option value="distance">Nearest First</option>}
              </select>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          {viewMode === "map" ? (
            <div className="map-view-container">
              <div 
                ref={mapContainerRef} 
                className="discover-map"
                style={{ height: 420, borderRadius: 16 }}
              />
              {visibleFields.length === 0 && !loading && (
                <p style={{ textAlign: "center", marginTop: 12, color: "#6b7280" }}>
                  No fields to show on map.
                </p>
              )}
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
                  {field.distance && (
                    <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                      📍 {field.distance.toFixed(1)} km away
                    </p>
                  )}
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
