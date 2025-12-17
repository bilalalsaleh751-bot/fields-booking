import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// ========== Layout Components ==========
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import RequireAuth, { RequireRole, PublicRoute } from "./components/auth/RequireAuth";

// ========== Main Website Pages ==========
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import FieldDetails from "./pages/FieldDetails";
import BookingFlow from "./pages/BookingFlow";
import FAQ from "./pages/FAQ";

// ========== Unified Authentication ==========
import UnifiedLogin from "./auth/pages/UnifiedLogin";
import UserRegister from "./userAuth/pages/UserRegister";
import ForgotPassword from "./userAuth/pages/ForgotPassword";
import ResetPassword from "./userAuth/pages/ResetPassword";

// ========== User Account ==========
import AccountLayout from "./account/layout/AccountLayout";
import AccountBookings from "./account/pages/AccountBookings";
import AccountProfile from "./account/pages/AccountProfile";

// ========== Owner Dashboard ==========
import OwnerDashboard from "./dashboard/pages/OwnerDashboard";
import OwnerFields from "./dashboard/pages/OwnerFields";
import OwnerBookings from "./dashboard/pages/OwnerBookings";
import OwnerReviews from "./dashboard/pages/OwnerReviews";
import OwnerFinancial from "./dashboard/pages/OwnerFinancial";
import OwnerSettings from "./dashboard/pages/OwnerSettings";
import OwnerLayout from "./dashboard/layout/OwnerLayout";

// ========== Owner Registration ==========
import OwnerRegisterStep1 from "./ownerAuth/pages/OwnerRegisterStep1";
import OwnerRegisterStep2 from "./ownerAuth/pages/OwnerRegisterStep2";
import OwnerRegisterStep3 from "./ownerAuth/pages/OwnerRegisterStep3";
import OwnerPendingApproval from "./ownerAuth/pages/OwnerPendingApproval";

// ========== Admin Dashboard ==========
import AdminLayout from "./admin/layout/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminOwners from "./admin/pages/AdminOwners";
import AdminFields from "./admin/pages/AdminFields";
import AdminBookings from "./admin/pages/AdminBookings";
import AdminFinancial from "./admin/pages/AdminFinancial";
import AdminCMS from "./admin/pages/AdminCMS";
import AdminNotifications from "./admin/pages/AdminNotifications";
import AdminSettings from "./admin/pages/AdminSettings";
import AdminActivity from "./admin/pages/AdminActivity";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminAccounts from "./admin/pages/AdminAccounts";


// =====================================
// Layout Wrapper - ROLE-BASED VISIBILITY
// =====================================
function AppLayout() {
  const location = useLocation();
  const { auth } = useAuth();
  
  // Route detection
  const isOwnerRoute = location.pathname.startsWith("/owner");
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAccountRoute = location.pathname.startsWith("/account");
  const isAuthPage = ["/login", "/register", "/forgot-password"].includes(location.pathname) || location.pathname.startsWith("/reset-password");
  const isHomePage = location.pathname === "/";
  const isFAQPage = location.pathname === "/faq";
  
  // CRITICAL: Admin and Owner NEVER see header
  // Header only shown for: guests or users on public pages
  const isAdminOrOwner = auth && (auth.role === "admin" || auth.role === "super_admin" || auth.role === "owner");
  const hideHeader = isAdminOrOwner || isOwnerRoute || isAdminRoute || isAccountRoute || isAuthPage;
  
  // Footer shown only for public pages that don't have their own footer
  const hideFooter = hideHeader || isHomePage || isFAQPage;

  return (
    <>
      {/* Header: ONLY for users/guests on public pages */}
      {!hideHeader && <Header />}

      <Routes>
        {/* ========== Main Website (Users/Guests Only) ========== */}
        <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
        <Route path="/discover" element={<PublicRoute><Discover /></PublicRoute>} />
        <Route path="/field/:id" element={<PublicRoute><FieldDetails /></PublicRoute>} />
        <Route path="/booking/:fieldId" element={<PublicRoute><BookingFlow /></PublicRoute>} />
        <Route path="/faq" element={<PublicRoute><FAQ /></PublicRoute>} />


        {/* ========== UNIFIED Authentication (Single Login) ========== */}
        <Route path="/login" element={<UnifiedLogin />} />
        <Route path="/register" element={<UserRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Legacy routes redirect to unified login */}
        <Route path="/owner/login" element={<Navigate to="/login" replace />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />


        {/* ========== User Account (Users Only) ========== */}
        <Route path="/account" element={
          <RequireRole allowedRoles={["user"]}>
            <AccountLayout />
          </RequireRole>
        }>
          <Route path="bookings" element={<AccountBookings />} />
          <Route path="profile" element={<AccountProfile />} />
        </Route>


        {/* ========== Owner Registration (Separate flow) ========== */}
        <Route path="/owner/register" element={<OwnerRegisterStep1 />} />
        <Route path="/owner/register/details" element={<OwnerRegisterStep2 />} />
        <Route path="/owner/register/upload" element={<OwnerRegisterStep3 />} />
        <Route path="/owner/pending" element={<OwnerPendingApproval />} />


        {/* ========== Owner Panel (Owners Only) ========== */}
        <Route path="/owner" element={
          <RequireRole allowedRoles={["owner"]}>
            <OwnerLayout />
          </RequireRole>
        }>
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="fields" element={<OwnerFields />} />
          <Route path="bookings" element={<OwnerBookings />} />
          <Route path="financial" element={<OwnerFinancial />} />
          <Route path="reviews" element={<OwnerReviews />} />
          <Route path="settings" element={<OwnerSettings />} />
        </Route>


        {/* ========== Admin Panel (Admin/Super Admin Only) ========== */}
        <Route path="/admin" element={
          <RequireRole allowedRoles={["admin"]}>
            <AdminLayout />
          </RequireRole>
        }>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="owners" element={<AdminOwners />} />
          <Route path="fields" element={<AdminFields />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="financial" element={<AdminFinancial />} />
          <Route path="cms" element={<AdminCMS />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="activity" element={<AdminActivity />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="accounts" element={<AdminAccounts />} />
        </Route>

      </Routes>

      {/* Footer: ONLY for users/guests on public pages */}
      {!hideFooter && <Footer />}
    </>
  );
}


// =====================================
// App Root
// =====================================
function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
