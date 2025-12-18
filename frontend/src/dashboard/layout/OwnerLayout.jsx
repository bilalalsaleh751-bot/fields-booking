// src/dashboard/layout/OwnerLayout.jsx
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import "../dashboard.css";

function OwnerLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="dashboard-root">
      <button 
        className={`dashboard-mobile-menu-toggle ${isMenuOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        {isMenuOpen ? '✕' : '☰'}
      </button>
      <Sidebar isOpen={isMenuOpen} onClose={closeMenu} />
      <div className="dashboard-main">
        <Outlet />
      </div>
    </div>
  );
}

export default OwnerLayout;
