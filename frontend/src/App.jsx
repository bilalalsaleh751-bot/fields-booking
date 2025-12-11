import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

import Home from "./pages/Home";
import Discover from "./pages/Discover";
import FieldDetails from "./pages/FieldDetails";
import BookingFlow from "./pages/BookingFlow";

// نستعمل Iframe لعرض لوحة التحكم
function AdminFrame() {
  return (
    <iframe
      src="/admin/index.html"
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
        margin: 0,
        padding: 0,
        display: "block",
      }}
    ></iframe>
  );
}

// التفاف بسيط لإخفاء الهيدر والفوتر عند /admin
function AppLayout() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdminPage && <Header />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/field/:id" element={<FieldDetails />} />
        <Route path="/booking/:fieldId" element={<BookingFlow />} />

        {/* Dashboard */}
        <Route path="/admin/*" element={<AdminFrame />} />
      </Routes>

      {!isAdminPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
