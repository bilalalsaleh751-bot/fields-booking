// src/admin/layout/AdminLayout.jsx
import { Outlet, Navigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import "../admin.css";

function AdminLayout() {
  const adminToken = localStorage.getItem("adminToken");
  
  if (!adminToken) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader />
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;

