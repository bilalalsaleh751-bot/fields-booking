// src/components/MapDisplay.jsx
import { useEffect, useRef, useState } from "react";

function MapDisplay({ lat, lng, name, showDirections = true }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Leaflet from CDN
  useEffect(() => {
    if (window.L) {
      setIsLoaded(true);
      return;
    }

    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !lat || !lng) return;
    if (mapInstanceRef.current) return; // Already initialized

    const L = window.L;

    // Create map (non-interactive for display)
    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      dragging: true,
      zoomControl: true,
    }).setView([lat, lng], 15);

    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    // Add marker with popup
    L.marker([lat, lng])
      .addTo(map)
      .bindPopup(name || "Field Location")
      .openPopup();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoaded, lat, lng, name]);

  // Open Google Maps with directions
  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  };

  // Open location in Google Maps
  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, "_blank");
  };

  if (!lat || !lng) {
    return null;
  }

  if (!isLoaded) {
    return (
      <div style={{
        height: 200,
        background: "#f1f5f9",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748b",
        fontSize: 13,
      }}>
        Loading map...
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div
        ref={mapRef}
        style={{
          height: 200,
          borderRadius: 8,
        }}
      />
      
      {showDirections && (
        <div style={{ 
          display: "flex", 
          gap: 8, 
          marginTop: 10,
          flexWrap: "wrap"
        }}>
          <button
            onClick={openGoogleMaps}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#1e40af",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#eff6ff";
              e.currentTarget.style.borderColor = "#93c5fd";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}
          >
            🧭 Get Directions
          </button>
          
          <button
            onClick={openInGoogleMaps}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#475569",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}
          >
            🗺️ Open in Google Maps
          </button>
        </div>
      )}
    </div>
  );
}

export default MapDisplay;

