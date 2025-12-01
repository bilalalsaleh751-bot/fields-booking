import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

import Home from "./pages/Home";
import Discover from "./pages/Discover";
import FieldDetails from "./pages/FieldDetails";

import "./index.css";

function App() {
  return (
    <Router>
      <Header />

      <div className="app-root">
        <Routes>
          {/* Homepage */}
          <Route path="/" element={<Home />} />

          {/* Discover/Search Results */}
          <Route path="/discover" element={<Discover />} />

          {/* Field Details */}
          <Route path="/field/:id" element={<FieldDetails />} />
        </Routes>
      </div>

      <Footer />
    </Router>
  );
}

export default App;
