import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

import Home from "./pages/Home";
import Discover from "./pages/Discover";
import FieldDetails from "./pages/FieldDetails";
import BookingFlow from "./pages/BookingFlow";

import "./index.css";

function App() {
  return (
    <Router>
      <Header />

      <div className="app-root">
        <Routes>

          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/field/:id" element={<FieldDetails />} />

          {/* Booking Page */}
          <Route path="/booking/:fieldId" element={<BookingFlow />} />

        </Routes>
      </div>

      <Footer />
    </Router>
  );
}

export default App;
