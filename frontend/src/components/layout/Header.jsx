import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    // CRITICAL: Use AuthContext logout to clear ALL auth data including authRole
    logout();
    setShowUserMenu(false);
    navigate("/");
  };

  // Determine if user is logged in (only for regular users, not admin/owner)
  const isUser = auth?.role === "user";
  const userName = auth?.name || localStorage.getItem("userName") || "User";

  return (
    <header className="main-header">
      <div className="header-container">
        <Link to="/" className="logo-area">
          <div className="logo-circle">SL</div>
          <span className="logo-text">Sport Lebanon</span>
        </Link>

        <nav className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/discover" className="nav-link">Discover</Link>
          <Link to="/faq" className="nav-link">FAQ</Link>
        </nav>

        <div className="nav-actions">
          <Link to="/discover" className="btn-outline">
            Book Now
          </Link>

          {!isUser ? (
            // NOT LOGGED IN - Show Login button
            <Link to="/login" className="btn-solid">
              Login
            </Link>
          ) : (
            // LOGGED IN AS USER - Show user menu only
            <div className="user-menu-wrapper" ref={menuRef}>
              <button
                className="btn-solid user-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <span className="user-avatar">
                  {userName.charAt(0).toUpperCase()}
                </span>
                <span className="user-name">{userName}</span>
                <span className="dropdown-arrow">▼</span>
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <Link
                    to="/account/bookings"
                    className="dropdown-item"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <span className="dropdown-icon">📅</span>
                    My Bookings
                  </Link>
                  <Link
                    to="/account/profile"
                    className="dropdown-item"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <span className="dropdown-icon">👤</span>
                    My Profile
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <span className="dropdown-icon">🚪</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
