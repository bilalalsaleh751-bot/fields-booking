import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="main-header">
      <div className="logo-area">
        <div className="logo-circle">SL</div>
        <span className="logo-text">Sport Lebanon</span>
      </div>

      <nav className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/discover" className="nav-link">Discover</Link>
        <Link to="/new-owners" className="nav-link">New Owners</Link>
        <Link to="/support" className="nav-link">Support</Link>
      </nav>

      <div className="nav-actions">
        <Link to="/book">
          <button className="btn-outline">Book Now</button>
        </Link>

        <Link to="/login">
          <button className="btn-solid">Login</button>
        </Link>
      </div>
    </header>
  );
};

export default Header;
