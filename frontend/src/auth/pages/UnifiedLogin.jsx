import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./UnifiedLogin.css";

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Try unified login endpoint
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      // Store auth data based on role
      const { token, user, role } = data;

      // Clear any existing tokens first
      localStorage.removeItem("userToken");
      localStorage.removeItem("ownerToken");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("ownerId");
      localStorage.removeItem("userName");
      localStorage.removeItem("ownerName");
      localStorage.removeItem("adminData");

      // Store based on role
      if (role === "user") {
        localStorage.setItem("userToken", token);
        localStorage.setItem("userId", user._id);
        localStorage.setItem("userName", user.name || "User");
        localStorage.setItem("userEmail", user.email);
        localStorage.setItem("userRole", "user");
        navigate("/");
      } else if (role === "owner") {
        localStorage.setItem("ownerToken", token);
        localStorage.setItem("ownerId", user._id);
        localStorage.setItem("ownerName", user.fullName || user.name || "Owner");
        localStorage.setItem("ownerRole", "owner");
        
        // Check if owner is approved
        if (user.status === "pending") {
          navigate("/owner/pending");
        } else if (user.status === "approved") {
          navigate("/owner/dashboard");
        } else {
          setError("Your account is not approved. Please contact support.");
        }
      } else if (role === "admin" || role === "super_admin") {
        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminData", JSON.stringify(user));
        localStorage.setItem("adminRole", role);
        navigate("/admin/dashboard");
      } else {
        setError("Unknown role. Please contact support.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Server error. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="unified-login-wrapper">
      <div className="unified-login-card">
        <div className="unified-login-header">
          <Link to="/" className="unified-login-logo">
            <div className="logo-circle">SL</div>
            <span>Sport Lebanon</span>
          </Link>
        </div>

        <h1 className="unified-login-title">Welcome</h1>
        <p className="unified-login-subtitle">Sign in to your account</p>

        {error && <div className="unified-login-error">{error}</div>}

        <form onSubmit={handleLogin} className="unified-login-form">
          <div className="unified-login-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="unified-login-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="unified-login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="unified-login-footer">
          <p>
            <Link to="/forgot-password" className="unified-login-link">
              Forgot your password?
            </Link>
          </p>
          <p style={{ marginTop: 12 }}>
            Don't have an account?{" "}
            <Link to="/register" className="unified-login-link">
              Sign up
            </Link>
          </p>
          <p style={{ marginTop: 12 }}>
            <Link to="/owner/register" className="unified-login-link">
              Register as Field Owner →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

