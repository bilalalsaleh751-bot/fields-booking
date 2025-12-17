import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./UnifiedLogin.css";

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
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

      // Use AuthContext to store auth state
      login(token, { ...user, role });

      // Redirect based on role
      if (role === "user") {
        navigate("/");
      } else if (role === "owner") {
        // Backend already validated status, handle routing based on status
        // Normalize status to lowercase for case-insensitive comparison
        const ownerStatus = (user.status || "").toLowerCase().trim();
        if (ownerStatus === "pending" || ownerStatus === "pending_review") {
          navigate("/owner/pending");
        } else if (ownerStatus === "approved") {
          navigate("/owner/dashboard");
        } else {
          // Fallback - should not reach here if backend validation is correct
          console.error("Unexpected owner status:", user.status);
          setError("Account status issue. Please contact support.");
          setLoading(false);
          return;
        }
      } else if (role === "admin" || role === "super_admin") {
        navigate("/admin/dashboard");
      } else {
        setError("Unknown role. Please contact support.");
        setLoading(false);
        return;
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
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(""); // Clear error on input change
              }}
              required
            />
          </div>

          <div className="unified-login-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(""); // Clear error on input change
              }}
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

