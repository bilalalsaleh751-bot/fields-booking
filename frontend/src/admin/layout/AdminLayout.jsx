// src/admin/layout/AdminLayout.jsx
import { Outlet, Navigate } from "react-router-dom";
import { useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import "../admin.css";

function AdminLayout() {
  const adminToken = localStorage.getItem("adminToken");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  if (!adminToken) {
    return <Navigate to="/admin/login" replace />;
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  
  return (
    <div className="admin-layout">
      <AdminSidebar isOpen={isMenuOpen} onClose={closeMenu} />
      <div className="admin-main">
        <AdminHeader onMenuToggle={toggleMenu} isMenuOpen={isMenuOpen} />
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;

