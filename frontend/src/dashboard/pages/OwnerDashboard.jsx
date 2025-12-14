// src/dashboard/pages/OwnerDashboard.jsx
import "../dashboard.css";
import DashboardHeader from "../components/DashboardHeader";
import StatsGrid from "../components/StatsGrid";
import BookingsTable from "../components/BookingsTable";
import FinancialOverview from "../components/FinancialOverview";
import ReviewsPanel from "../components/ReviewsPanel";

import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function OwnerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [ownerName, setOwnerName] = useState("");
  const [ownerId, setOwnerId] = useState("");

  // Dashboard data
  const [stats, setStats] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [financial, setFinancial] = useState(null);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("ownerToken");
    const storedName = localStorage.getItem("ownerName");
    const storedId = localStorage.getItem("ownerId");

    if (!token) {
      navigate("/owner/login");
      return;
    }

    if (storedName) setOwnerName(storedName);
    if (storedId) setOwnerId(storedId);
  }, [navigate]);

  // Fetch dashboard data function (reusable)
  const fetchDashboard = useCallback(async () => {
    if (!ownerId) return;
    
    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:5000/api/owner/dashboard/overview?ownerId=${ownerId}`,
        { cache: "no-store" } // Always fetch fresh data
      );
      const data = await res.json();

      if (!res.ok) throw new Error();

      setStats(data.stats);
      setUpcomingBookings(data.upcomingBookings || []);
      setFinancial(data.financial);
      setReviews(data.reviews || []);
      setError("");
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

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
