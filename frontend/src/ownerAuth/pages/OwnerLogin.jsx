import "./../auth.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function OwnerLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // Handle non-200 responses BUT still check for status field
      // (suspended returns 403 with status field)
      if (!response.ok) {
        // Check if it's a suspended account (403 with status)
        if (data.status === "suspended") {
          setError(data.message || "Your account has been suspended. Please contact support.");
          setLoading(false);
          return;
        }
        // Other errors
        setError(data.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      // Handle different owner statuses from 200 responses
      if (data.status === "approved") {
        // Approved - store auth data and navigate to dashboard
        localStorage.setItem("ownerToken", data.token);
        localStorage.setItem("ownerId", data.owner._id);
        localStorage.setItem("ownerName", data.owner.fullName || "");
        navigate("/owner/dashboard");
      } 
      else if (data.status === "pending") {
        // Account pending review
        navigate("/owner/pending");
      }
      else if (data.status === "rejected") {
        // Application was rejected
        setError("Your application was rejected. Please contact support for more information.");
      }
      else if (data.status === "suspended") {
        // Account suspended by admin
        setError(data.message || "Your account has been suspended. Please contact support.");
      }
      else if (data.status === "not_approved") {
        // Account exists but not yet approved
        setError("Your account is not yet approved. Please complete registration or contact support.");
      }
      else {
        // Unknown status - show error message if available
        setError(data.message || "Unable to log in. Please try again or contact support.");
      }

    } catch (err) {
      console.log(err);
      setError("Server error — please try again.");
    }

    setLoading(false);
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">Owner Login</h1>
        <p className="auth-subtitle">
          Log in to manage your fields & bookings.
        </p>

        {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

        <form onSubmit={handleLogin}>
          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Login"}
          </button>
        </form>

        <div className="auth-note">
          Don’t have an account?{" "}
          <span
            className="auth-link"
            onClick={() => navigate("/owner/register")}
          >
            Register now
          </span>
        </div>
      </div>
    </div>
  );
}

export default OwnerLogin;
