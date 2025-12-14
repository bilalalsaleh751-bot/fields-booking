import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

// ========== Layout Components ==========
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

// ========== Main Website Pages ==========
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import FieldDetails from "./pages/FieldDetails";
import BookingFlow from "./pages/BookingFlow";
import FAQ from "./pages/FAQ";

// ========== User Authentication ==========
import UserLogin from "./userAuth/pages/UserLogin";
import UserRegister from "./userAuth/pages/UserRegister";

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

// ========== Owner Authentication Pages ==========
import OwnerLogin from "./ownerAuth/pages/OwnerLogin";
import OwnerRegisterStep1 from "./ownerAuth/pages/OwnerRegisterStep1";
import OwnerRegisterStep2 from "./ownerAuth/pages/OwnerRegisterStep2";
import OwnerRegisterStep3 from "./ownerAuth/pages/OwnerRegisterStep3";
import OwnerPendingApproval from "./ownerAuth/pages/OwnerPendingApproval";

// ========== Admin Dashboard ==========
import AdminLayout from "./admin/layout/AdminLayout";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminOwners from "./admin/pages/AdminOwners";
import AdminFields from "./admin/pages/AdminFields";
import AdminBookings from "./admin/pages/AdminBookings";
import AdminFinancial from "./admin/pages/AdminFinancial";
import AdminCMS from "./admin/pages/AdminCMS";
import AdminNotifications from "./admin/pages/AdminNotifications";
import AdminSettings from "./admin/pages/AdminSettings";
import AdminActivity from "./admin/pages/AdminActivity";


// =====================================
// Layout Wrapper
// =====================================
function AppLayout() {
  const location = useLocation();

  // Routes that need special layout handling
  const isOwnerRoute = location.pathname.startsWith("/owner");
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAccountRoute = location.pathname.startsWith("/account");
  const isAuthPage = ["/login", "/register"].includes(location.pathname);
  const isHomePage = location.pathname === "/";
  const isFAQPage = location.pathname === "/faq";
  
  // Hide header for: owner, admin, account, and auth pages
  const hideHeader = isOwnerRoute || isAdminRoute || isAccountRoute || isAuthPage;
  
  // Hide footer for: pages that have their own footer, or special layouts
  const hideFooter = hideHeader || isHomePage || isFAQPage;

  return (
    <>
      {/* Show header only for public pages */}
      {!hideHeader && <Header />}

      <Routes>

        {/* ========== Main Website ========== */}
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/field/:id" element={<FieldDetails />} />
        <Route path="/booking/:fieldId" element={<BookingFlow />} />
        <Route path="/faq" element={<FAQ />} />


        {/* ========== User Authentication ========== */}
        <Route path="/login" element={<UserLogin />} />
        <Route path="/register" element={<UserRegister />} />


        {/* ========== User Account ========== */}
        <Route path="/account" element={<AccountLayout />}>
          <Route path="bookings" element={<AccountBookings />} />
          <Route path="profile" element={<AccountProfile />} />
        </Route>


        {/* ========== Owner Authentication ========== */}
        <Route path="/owner/login" element={<OwnerLogin />} />
        <Route path="/owner/register" element={<OwnerRegisterStep1 />} />
        <Route path="/owner/register/details" element={<OwnerRegisterStep2 />} />
        <Route path="/owner/register/upload" element={<OwnerRegisterStep3 />} />
        <Route path="/owner/pending" element={<OwnerPendingApproval />} />


        {/* ========== Owner Panel ========== */}
        <Route path="/owner" element={<OwnerLayout />}>
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="fields" element={<OwnerFields />} />
          <Route path="bookings" element={<OwnerBookings />} />
          <Route path="financial" element={<OwnerFinancial />} />
          <Route path="reviews" element={<OwnerReviews />} />
          <Route path="settings" element={<OwnerSettings />} />
        </Route>


        {/* ========== Admin Authentication ========== */}
        <Route path="/admin/login" element={<AdminLogin />} />


        {/* ========== Admin Panel ========== */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="owners" element={<AdminOwners />} />
          <Route path="fields" element={<AdminFields />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="financial" element={<AdminFinancial />} />
          <Route path="cms" element={<AdminCMS />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="activity" element={<AdminActivity />} />
        </Route>

      </Routes>

      {/* Show footer only for public pages that don't have their own */}
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
