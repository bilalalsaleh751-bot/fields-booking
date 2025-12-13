// src/dashboard/components/MapPicker.jsx
import { useEffect, useRef, useState, useCallback } from "react";

// Default center (Beirut, Lebanon)
const DEFAULT_CENTER = { lat: 33.8938, lng: 35.5018 };

function MapPicker({ lat, lng, onChange }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [isLoaded, setIsLoaded] = useState(false);

  // Keep onChange ref updated without triggering re-renders
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Load Leaflet from CDN (only once)
  useEffect(() => {
    if (window.L) {
      setIsLoaded(true);
      return;
    }

    // Check if already loading
    if (document.querySelector('script[src*="leaflet"]')) {
      const checkLoaded = setInterval(() => {
        if (window.L) {
          setIsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
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

  // Initialize map (only once when loaded)
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = window.L;
    const initialLat = lat || DEFAULT_CENTER.lat;
    const initialLng = lng || DEFAULT_CENTER.lng;

    // Create map
    const map = L.map(mapRef.current).setView([initialLat, initialLng], 13);
    mapInstanceRef.current = map;

    // Add tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Add marker if coordinates exist
    if (lat && lng) {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }

    // Click handler to set location - uses ref to avoid stale closure
    map.on("click", (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;

      // Update or create marker
      if (markerRef.current) {
        markerRef.current.setLatLng([clickLat, clickLng]);
      } else {
        markerRef.current = L.marker([clickLat, clickLng]).addTo(map);
      }

      // Callback with new coordinates - use ref for latest callback
      if (onChangeRef.current) {
        onChangeRef.current({
          lat: clickLat.toFixed(6),
          lng: clickLng.toFixed(6),
        });
      }
    });

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isLoaded]); // Only depend on isLoaded, not lat/lng

  // Update marker when props change (without re-creating map)
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    const L = window.L;
    if (lat && lng) {
      const numLat = parseFloat(lat);
      const numLng = parseFloat(lng);
      if (!isNaN(numLat) && !isNaN(numLng)) {
        if (markerRef.current) {
          markerRef.current.setLatLng([numLat, numLng]);
        } else {
          markerRef.current = L.marker([numLat, numLng]).addTo(mapInstanceRef.current);
        }
        // Don't auto-pan on every update to prevent jarring UX
      }
    }
  }, [lat, lng, isLoaded]);

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
    <div>
      <div
        ref={mapRef}
        style={{
          height: 200,
          borderRadius: 8,
          border: "1px solid #e2e8f0",
        }}
      />
      <p style={{ fontSize: 11, color: "#64748b", marginTop: 6, marginBottom: 0 }}>
        Click on the map to set location
      </p>
    </div>
  );
}

export default MapPicker;

