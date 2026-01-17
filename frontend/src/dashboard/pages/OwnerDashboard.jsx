// src/dashboard/pages/OwnerDashboard.jsx
import "../dashboard.css";
import DashboardHeader from "../components/DashboardHeader";
import StatsGrid from "../components/StatsGrid";
import BookingsTable from "../components/BookingsTable";
import FinancialOverview from "../components/FinancialOverview";
import ReviewsPanel from "../components/ReviewsPanel";

import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";


function OwnerDashboard() {
  const location = useLocation();
  const abortControllerRef = useRef(null);

  const [ownerName, setOwnerName] = useState("");
  const [ownerId, setOwnerId] = useState("");

  // Dashboard data
  const [stats, setStats] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [financial, setFinancial] = useState(null);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get owner info directly from localStorage (path-based auth)
  // This ensures each tab loads its own session data independently
  useEffect(() => {
    const storedToken = localStorage.getItem("ownerToken");
    const storedName = localStorage.getItem("ownerName");
    const storedId = localStorage.getItem("ownerId");

    // If no owner token, the RouteGuard should redirect
    // But double-check here for safety
    if (!storedToken) {
      console.warn("No owner token found, should be redirected by RouteGuard");
      return;
    }

    if (storedName) setOwnerName(storedName);
    if (storedId) setOwnerId(storedId);
  }, []);

  // Fetch dashboard data function with abort controller for cleanup
  const fetchDashboard = useCallback(async () => {
    if (!ownerId) return;
    
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE}/api/owner/dashboard/overview?ownerId=${ownerId}`,
        { 
          cache: "no-store",
          signal: abortControllerRef.current.signal 
        }
      );
      const data = await res.json();

      if (!res.ok) throw new Error();

      setStats(data.stats);
      setUpcomingBookings(data.upcomingBookings || []);
      setFinancial(data.financial);
      setReviews(data.reviews || []);
      setError("");
    } catch (err) {
      // Don't show error if request was aborted
      if (err.name === "AbortError") return;
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [ownerId]);
  
  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Refresh trigger state - updated when booking actions occur
  const [refreshKey, setRefreshKey] = useState(0);

  // Check for pending refresh from other pages (booking complete/cancel)
  useEffect(() => {
    const pendingRefresh = sessionStorage.getItem("dashboardNeedsRefresh");
    if (pendingRefresh) {
      sessionStorage.removeItem("dashboardNeedsRefresh");
      setRefreshKey((k) => k + 1); // Trigger re-fetch
    }
  }, [location.key]); // Check on every navigation

  // Fetch dashboard on mount, navigation, or refresh trigger
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, refreshKey]); // refreshKey forces re-fetch after booking actions

  if (loading) {
    return (
      <div className="dashboard-panel">
        <p className="dashboard-loading">Loading dashboard…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="dashboard-panel">
        <p style={{ padding: 20, color: "#dc2626", margin: 0 }}>{error}</p>
      </div>
    );
  }

  return (
    <>
      <DashboardHeader ownerName={ownerName} />

      <StatsGrid stats={stats} />

      <div className="dashboard-content-grid">
        <BookingsTable bookings={upcomingBookings} />

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <FinancialOverview financial={financial} />
          <ReviewsPanel reviews={reviews} />
        </div>
      </div>
    </>
  );
}

export default OwnerDashboard;
