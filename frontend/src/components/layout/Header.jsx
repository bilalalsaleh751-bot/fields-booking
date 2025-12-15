import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState({
    isUser: false,
    name: "",
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  // Check auth state on mount - ONLY for users, never admin/owner
  useEffect(() => {
    checkAuthState();
    
    // Listen for storage changes (logout from other tabs)
    const handleStorageChange = () => {
      checkAuthState();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const checkAuthState = () => {
    const userToken = localStorage.getItem("userToken");
    const ownerToken = localStorage.getItem("ownerToken");
    const adminToken = localStorage.getItem("adminToken");

    // CRITICAL: Header should ONLY show for users or guests
    // If admin or owner token exists, do NOT show header menu
    if (adminToken || ownerToken) {
      // Admin/Owner logged in - they should not see this header
      // This should never happen due to route guards, but as safety:
      setAuthState({
        isUser: false,
        name: "",
      });
      return;
    }

    // Only show user menu if user token exists
    if (userToken) {
      setAuthState({
        isUser: true,
        name: localStorage.getItem("userName") || "User",
      });
    } else {
      setAuthState({
        isUser: false,
        name: "",
      });
    }
  };

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
    // Clear user auth tokens only
    localStorage.removeItem("userToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    
    setAuthState({
      isUser: false,
      name: "",
    });
    setShowUserMenu(false);
    navigate("/");
  };

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

          {!authState.isUser ? (
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
                  {authState.name.charAt(0).toUpperCase()}
                </span>
                <span className="user-name">{authState.name}</span>
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
