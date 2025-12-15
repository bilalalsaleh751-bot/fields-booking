import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import "./AccountLayout.css";

export default function AccountLayout() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const name = localStorage.getItem("userName");
    
    if (!token) {
      navigate("/login");
      return;
    }
    
    setUserName(name || "User");
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  return (
    <div className="account-layout">
      {/* Header */}
      <header className="account-header">
        <div className="account-header-left">
          <Link to="/" className="account-back-btn" title="Back to Website">
            ← Back
          </Link>
          <Link to="/" className="account-logo">
            <div className="logo-circle">SL</div>
            <span>Sport Lebanon</span>
          </Link>
        </div>
        <div className="account-header-right">
          <span className="account-user-name">👤 {userName}</span>
          <button onClick={handleLogout} className="account-logout-btn">
            Logout
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="account-nav">
        <div className="account-nav-inner">
          <NavLink to="/account/bookings" className={({ isActive }) => `account-nav-link ${isActive ? "active" : ""}`}>
            📅 My Bookings
          </NavLink>
          <NavLink to="/account/profile" className={({ isActive }) => `account-nav-link ${isActive ? "active" : ""}`}>
            👤 Profile
          </NavLink>
        </div>
      </nav>

      {/* Content */}
      <main className="account-content">
        <Outlet />
      </main>
    </div>
  );
}
