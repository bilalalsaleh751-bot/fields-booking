import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

// ========== Layout Components ==========
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

// ========== Main Website Pages ==========
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import FieldDetails from "./pages/FieldDetails";
import BookingFlow from "./pages/BookingFlow";

// ========== Owner Dashboard ==========
import OwnerDashboard from "./dashboard/pages/OwnerDashboard";
import OwnerFields from "./dashboard/pages/OwnerFields";
import OwnerBookings from "./dashboard/pages/OwnerBookings";
import OwnerReviews from "./dashboard/pages/OwnerReviews";
import OwnerFinancial from "./dashboard/pages/OwnerFinancial";
import OwnerLayout from "./dashboard/layout/OwnerLayout";

// ========== Owner Authentication Pages ==========
import OwnerLogin from "./ownerAuth/pages/OwnerLogin";
import OwnerRegisterStep1 from "./ownerAuth/pages/OwnerRegisterStep1";
import OwnerRegisterStep2 from "./ownerAuth/pages/OwnerRegisterStep2";
import OwnerRegisterStep3 from "./ownerAuth/pages/OwnerRegisterStep3";
import OwnerPendingApproval from "./ownerAuth/pages/OwnerPendingApproval";


// =====================================
// Layout Wrapper
// =====================================
function AppLayout() {
  const location = useLocation();

  // جميع صفحات المالك تبدأ بـ /owner
  const isOwnerRoute = location.pathname.startsWith("/owner");

  return (
    <>
      {/* نخفي الهيدر في صفحات المالك */}
      {!isOwnerRoute && <Header />}

      <Routes>

        {/* ========== Main Website ==========
            المستخدم العادي (اللاعبين)
        ================================== */}
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/field/:id" element={<FieldDetails />} />
        <Route path="/booking/:fieldId" element={<BookingFlow />} />


        {/* ========== Owner Authentication ==========
            تسجيل – رفع مستندات – انتظار موافقة الأدمن
        ============================================ */}
        <Route path="/owner/login" element={<OwnerLogin />} />
        <Route path="/owner/register" element={<OwnerRegisterStep1 />} />
        <Route path="/owner/register/details" element={<OwnerRegisterStep2 />} />
        <Route path="/owner/register/upload" element={<OwnerRegisterStep3 />} />
        <Route path="/owner/pending" element={<OwnerPendingApproval />} />


        {/* ========== Owner Panel (Layout ثابت) ==========
            Dashboard + Fields + باقي الصفحات
        =============================================== */}
        <Route path="/owner" element={<OwnerLayout />}>
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="fields" element={<OwnerFields />} />
          <Route path="bookings" element={<OwnerBookings />} />
          <Route path="financial" element={<OwnerFinancial />} />
          <Route path="reviews" element={<OwnerReviews />} />
        </Route>

      </Routes>

      {/* نخفي الفوتر في صفحات المالك */}
      {!isOwnerRoute && <Footer />}
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
