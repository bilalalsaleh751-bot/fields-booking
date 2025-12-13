// src/dashboard/layout/OwnerLayout.jsx
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import "../dashboard.css";

function OwnerLayout() {
  return (
    <div className="dashboard-root">
      <Sidebar />
      <div className="dashboard-main">
        <Outlet />
      </div>
    </div>
  );
}

export default OwnerLayout;
