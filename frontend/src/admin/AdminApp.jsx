import React from "react";
import { BrowserRouter as Router } from "react-router-dom";

// مسار App الصحيح داخل berry vite
import App from "./vite/src/App.jsx";

export default function AdminApp() {
  return (
    <Router basename="/admin">
      <App />
    </Router>
  );
}
