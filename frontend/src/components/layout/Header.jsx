import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState({
    isUser: false,
    isOwner: false,
    isAdmin: false,
    name: "",
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  // Check auth state on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = () => {
    const userToken = localStorage.getItem("userToken");
    const ownerToken = localStorage.getItem("ownerToken");
    const adminToken = localStorage.getItem("adminToken");

    if (adminToken) {
      setAuthState({
        isUser: false,
        isOwner: false,
        isAdmin: true,
        name: "Admin",
      });
    } else if (ownerToken) {
      setAuthState({
        isUser: false,
        isOwner: true,
        isAdmin: false,
        name: localStorage.getItem("ownerName") || "Owner",
      });
    } else if (userToken) {
      setAuthState({
        isUser: true,
        isOwner: false,
        isAdmin: false,
        name: localStorage.getItem("userName") || "User",
      });
    } else {
      setAuthState({
        isUser: false,
        isOwner: false,
        isAdmin: false,
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
    // Clear all auth tokens
    localStorage.removeItem("userToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("ownerToken");
    localStorage.removeItem("ownerName");
    localStorage.removeItem("ownerId");
    localStorage.removeItem("adminToken");
    
    setAuthState({
      isUser: false,
      isOwner: false,
      isAdmin: false,
      name: "",
    });
    setShowUserMenu(false);
    navigate("/");
  };

  const isLoggedIn = authState.isUser || authState.isOwner || authState.isAdmin;

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

          {!isLoggedIn ? (
            // NOT LOGGED IN - Show Login button
            <Link to="/login" className="btn-solid">
              Login
            </Link>
          ) : (
            // LOGGED IN - Show user menu
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
                  {/* USER MENU */}
                  {authState.isUser && (
                    <>
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
                    </>
                  )}

                  {/* OWNER MENU */}
                  {authState.isOwner && (
                    <>
                      <Link
                        to="/owner/dashboard"
                        className="dropdown-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <span className="dropdown-icon">📊</span>
                        Dashboard
                      </Link>
                      <Link
                        to="/owner/bookings"
                        className="dropdown-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <span className="dropdown-icon">📅</span>
                        Bookings
                      </Link>
                      <Link
                        to="/owner/settings"
                        className="dropdown-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <span className="dropdown-icon">⚙️</span>
                        Settings
                      </Link>
                    </>
                  )}

                  {/* ADMIN MENU */}
                  {authState.isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span className="dropdown-icon">🛡️</span>
                      Admin Dashboard
                    </Link>
                  )}

                  {/* LOGOUT */}
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
