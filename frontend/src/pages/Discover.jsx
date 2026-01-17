// src/pages/Discover.jsx
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import FieldCard from "../components/search/FieldCard";
import {
  SPORT_TYPES,
  SURFACE_TYPES,
  CITIES_LIST,
  AMENITIES as AMENITIES_LIST,
} from "../constants/filterOptions";
import "./Discover.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";


// Leaflet CSS (loaded once)
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

// Lebanon center coordinates
const DEFAULT_CENTER = { lat: 33.8938, lng: 35.5018 };
const DEFAULT_ZOOM = 9;

// Sports with icons for UI
const SPORTS_LIST = SPORT_TYPES.map(name => ({
  name,
  icon: {
    "Football": "⚽",
    "Basketball": "🏀",
    "Tennis": "🎾",
    "Padel": "🏓",
    "Volleyball": "🏐",
    "Swimming": "🏊",
    "Squash": "🏸",
    "Badminton": "🏸",
    "Cricket": "🏏",
    "Rugby": "🏉",
    "Multi-Purpose": "🏟️",
  }[name] || "🏟️"
}));

const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 6; // 6:00 to 20:00
  return `${String(hour).padStart(2, "0")}:00`;
});

export default function Discover() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Sport types from database
  const [sportTypes, setSportTypes] = useState([]);
  
  // CMS Content from database
  const [cmsContent, setCmsContent] = useState(null);
  const [cmsLoading, setCmsLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const locationHook = useLocation();
  
  // STABLE string representation of searchParams (prevents re-render loops)
  const searchParamsString = searchParams.toString();

  // ================== STATE ==================
  const [searchQuery, setSearchQuery] = useState("");
  const [sport, setSport] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState(""); // Area text input
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
  
  // Availability data for date/time filtering
  const [availabilityData, setAvailabilityData] = useState({}); // { fieldId: { slots, fullDay } }
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  
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
    const sArea = searchParams.get("area") || "";
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
    setArea(sArea);
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

  // ================== FETCH CMS CONTENT AND SPORT TYPES FROM DATABASE ==================
  useEffect(() => {
    const fetchDiscoverData = async () => {
      try {
        setCmsLoading(true);
        const res = await fetch(`${API_BASE}/api/public/discover`);
        if (res.ok) {
          const data = await res.json();
          setCmsContent(data.content);
          setSportTypes(data.sportTypes || []);
        } else {
          // Fallback to static list if API fails
          setSportTypes(SPORTS_LIST);
        }
      } catch (err) {
        console.error("Failed to fetch discover content:", err);
        // Fallback to static list if API fails
        setSportTypes(SPORTS_LIST);
      } finally {
        setCmsLoading(false);
      }
    };
    fetchDiscoverData();
  }, []);

  // ================== FETCH FROM BACKEND (uses stable string dependency) ==================
  useEffect(() => {
    let isCancelled = false;
    
    const loadFields = async () => {
      try {
        setLoading(true);
        setError("");

        const url = searchParamsString
          ? `${API_BASE}/api/fields/search?${searchParamsString}`
          : `${API_BASE}/api/fields/search`;

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

  // ================== FETCH AVAILABILITY WHEN DATE IS SELECTED ==================
  useEffect(() => {
    // Only fetch availability if date is selected and we have fields
    if (!date || fields.length === 0) {
      setAvailabilityData({});
      return;
    }

    let isCancelled = false;
    
    const fetchAvailability = async () => {
      setAvailabilityLoading(true);
      
      try {
        // Fetch availability for all fields in parallel (limit to first 20 for performance)
        const fieldsToCheck = fields.slice(0, 50);
        const availabilityPromises = fieldsToCheck.map(async (field) => {
          try {
            const res = await fetch(
              `${API_BASE}/api/fields/${field._id}/availability?date=${date}`
            );
            if (res.ok) {
              const data = await res.json();
              return { fieldId: field._id, ...data };
            }
            return { fieldId: field._id, slots: [], fullDay: false };
          } catch {
            return { fieldId: field._id, slots: [], fullDay: false };
          }
        });

        const results = await Promise.all(availabilityPromises);
        
        if (!isCancelled) {
          const availabilityMap = {};
          results.forEach((result) => {
            availabilityMap[result.fieldId] = {
              slots: result.slots || [],
              fullDay: result.fullDay || false,
              bookedRanges: result.bookedRanges || [],
            };
          });
          setAvailabilityData(availabilityMap);
        }
      } catch (err) {
        console.error("Failed to fetch availability:", err);
        if (!isCancelled) {
          setAvailabilityData({});
        }
      } finally {
        if (!isCancelled) {
          setAvailabilityLoading(false);
        }
      }
    };

    fetchAvailability();
    
    return () => { isCancelled = true; };
  }, [date, fields]);

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

    // Area filter (instant) - text search
    if (area.trim()) {
      const areaQuery = area.toLowerCase().trim();
      result = result.filter((f) => 
        (f.area || "").toLowerCase().includes(areaQuery)
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

    // ================== AVAILABILITY FILTER (DATE/TIME) ==================
    // If date is selected, filter out fields that are:
    // 1. Fully blocked on that date
    // 2. Have all time slots booked
    // 3. Have the specific selected time slot booked (if time is selected)
    if (date && Object.keys(availabilityData).length > 0) {
      result = result.filter((f) => {
        const availability = availabilityData[f._id];
        
        // If we don't have availability data for this field, include it (benefit of doubt)
        if (!availability) return true;
        
        // If the entire day is fully booked/blocked, exclude it
        if (availability.fullDay) return false;
        
        const slots = availability.slots || [];
        
        // If no slots are available at all on this day, exclude it
        if (slots.length === 0) return false;
        
        // Check if ANY slot is available
        const hasAnyAvailableSlot = slots.some((s) => s.isAvailable);
        if (!hasAnyAvailableSlot) return false;
        
        // If a specific time is selected, check that time slot
        if (time) {
          const selectedSlot = slots.find((s) => s.time === time);
          
          // If the selected time slot exists and is not available, exclude the field
          if (selectedSlot && !selectedSlot.isAvailable) return false;
          
          // If the time falls within a booked range, exclude the field
          const bookedRanges = availability.bookedRanges || [];
          if (bookedRanges.length > 0) {
            const selectedMinutes = parseInt(time.split(":")[0], 10) * 60 + 
                                    parseInt(time.split(":")[1] || "0", 10);
            
            for (const range of bookedRanges) {
              const startMin = parseInt(range.startTime.split(":")[0], 10) * 60 +
                              parseInt(range.startTime.split(":")[1] || "0", 10);
              const endMin = parseInt(range.endTime.split(":")[0], 10) * 60 +
                            parseInt(range.endTime.split(":")[1] || "0", 10);
              
              // If selected time falls within a booked range, exclude
              if (selectedMinutes >= startMin && selectedMinutes < endMin) {
                return false;
              }
            }
          }
        }
        
        return true;
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
  }, [fields, searchQuery, sport, city, area, minPrice, maxPrice, minRating, indoor, surfaceType, owner, amenitiesKey, sortBy, userLocation, calculateDistance, date, time, availabilityData]);

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
    if (area) params.set("area", area);
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
  }, [searchQuery, sport, city, area, date, time, minPrice, maxPrice, minRating, indoor, surfaceType, amenities, owner, sortBy, viewMode, navigate, locationHook.pathname]);

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
  // Get CMS values with fallbacks
  const headerTitle = cmsContent?.header?.title || "Discover";
  const headerSubtitle = cmsContent?.header?.subtitle || "Find courts across Lebanon";
  const headerBgImage = cmsContent?.header?.backgroundImage;
  const showSearch = cmsContent?.header?.showSearch !== false;
  const bannerEnabled = cmsContent?.banner?.isEnabled;
  const noResultsTitle = cmsContent?.noResults?.title || "No Courts Found";
  const noResultsMessage = cmsContent?.noResults?.message || "Try adjusting your filters or search in a different area";
  const ctaEnabled = cmsContent?.ctaSection?.isEnabled;
  const filterLabels = cmsContent?.filterLabels || {};

  return (
    <div className="discover-page">
      {/* PROMOTIONAL BANNER (if enabled) */}
      {bannerEnabled && cmsContent?.banner && (
        <div 
          className="discover-banner"
          style={{
            background: cmsContent.banner.backgroundImage
              ? `url(${cmsContent.banner.backgroundImage.startsWith("http")
                ? cmsContent.banner.backgroundImage
                : `${API_BASE}/${cmsContent.banner.backgroundImage}`}) center/cover`
              : cmsContent.banner.backgroundColor || "#3b82f6",
          }}
        >
          <div className="discover-banner-content">
            <h2>{cmsContent.banner.title}</h2>
            <p>{cmsContent.banner.description}</p>
            {cmsContent.banner.buttonText && cmsContent.banner.buttonLink && (
              <a href={cmsContent.banner.buttonLink} className="discover-banner-btn">
                {cmsContent.banner.buttonText}
              </a>
            )}
          </div>
        </div>
      )}

      {/* HEADER TITLE + SEARCH ROW */}
      <div 
        className="discover-header"
        style={headerBgImage ? {
          backgroundImage: `url(${headerBgImage.startsWith("http")
            ? headerBgImage
            : `${API_BASE}/${headerBgImage}`})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : {}}
      >
        <h1>{headerTitle}</h1>
        <p>{headerSubtitle}</p>

        {showSearch && (
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
        )}
        {locationError && (
          <p style={{ color: "#dc2626", fontSize: 13, marginTop: 4 }}>{locationError}</p>
        )}
      </div>

      {/* MAIN LAYOUT */}
      <div className="discover-layout">
        {/* SIDEBAR */}
        <aside className="filters-sidebar">
          <h3>Filters</h3>

          {/* Sport Filter - Dynamic from database */}
          <div className="filter-block">
            <span className="filter-label">{filterLabels.sport || "Sport"}</span>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="filter-select"
            >
              <option value="">All sports</option>
              {sportTypes.length > 0 ? (
                sportTypes.map((st) => (
                  <option key={st._id || st.name} value={st.name}>
                    {st.icon ? `${st.icon} ` : ""}{st.name}
                  </option>
                ))
              ) : (
                // Fallback to static list
                SPORTS_LIST.map((st) => (
                  <option key={st.name} value={st.name}>
                    {st.icon ? `${st.icon} ` : ""}{st.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* City Filter - EXACT same options as Home page */}
          <div className="filter-block">
            <span className="filter-label">{filterLabels.city || "City"}</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="filter-select"
            >
              <option value="">All cities</option>
              <option value="Beirut">Beirut</option>
              <option value="Tripoli">Tripoli</option>
              <option value="Sidon">Sidon</option>
              <option value="Jounieh">Jounieh</option>
              <option value="Byblos">Byblos</option>
              <option value="Zahle">Zahle</option>
            </select>
          </div>

          {/* Area Filter - Text input */}
          <div className="filter-block">
            <span className="filter-label">{filterLabels.area || "Area"}</span>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Enter area..."
              className="filter-input"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </div>

          {/* Date Filter - Same as Home page */}
          <div className="filter-block">
            <span className="filter-label">{filterLabels.date || "Date"}</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="filter-input"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </div>

          {/* Time Filter - Same as Home page (06:00 - 20:00) */}
          <div className="filter-block">
            <span className="filter-label">Time</span>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="filter-select"
            >
              <option value="">Any time</option>
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
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
              {SURFACE_TYPES.map((surface) => (
                <option key={surface} value={surface}>{surface}</option>
              ))}
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
                : availabilityLoading
                ? `Checking availability for ${date}...`
                : `${visibleFields.length} results found${date ? ` for ${date}` : ""}`}
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
            <div className="discover-no-results">
              <div className="no-results-icon">🔍</div>
              <h3>{noResultsTitle}</h3>
              <p>{noResultsMessage}</p>
              {cmsContent?.noResults?.showContactLink && (
                <a href="/contact" className="no-results-link">Contact Us</a>
              )}
            </div>
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

      {/* CTA Section (if enabled) */}
      {ctaEnabled && cmsContent?.ctaSection && (
        <div className="discover-cta-section">
          <h2>{cmsContent.ctaSection.title}</h2>
          <p>{cmsContent.ctaSection.description}</p>
          {cmsContent.ctaSection.buttonText && cmsContent.ctaSection.buttonLink && (
            <a href={cmsContent.ctaSection.buttonLink} className="discover-cta-btn">
              {cmsContent.ctaSection.buttonText}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
