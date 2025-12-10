import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

import Home from "./pages/Home";
import Discover from "./pages/Discover";
import FieldDetails from "./pages/FieldDetails";
import BookingFlow from "./pages/BookingFlow";

// نستعمل Iframe لعرض لوحة التحكم (أفضل وأبسط وأسرع مشروعياً)
function AdminFrame() {
  return (
    <iframe
      src="/admin/index.html"
      style={{ width: "100%", height: "100vh", border: "none" }}
    ></iframe>
  );
}

function App() {
  return (
    <Router>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/field/:id" element={<FieldDetails />} />
        <Route path="/booking/:fieldId" element={<BookingFlow />} />

        {/* Dashboard */}
        <Route path="/admin/*" element={<AdminFrame />} />
      </Routes>

      <Footer />
    </Router>
  );
}

export default App;
