import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./UserAuth.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";


export default function UserLogin() {
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
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // Store auth data
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userId", data.user._id);
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userEmail", data.user.email);

      // Redirect to home or previous page
      const returnTo = sessionStorage.getItem("returnTo");
      if (returnTo) {
        sessionStorage.removeItem("returnTo");
        navigate(returnTo);
      } else {
        navigate("/"); // Go to home, not profile
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="user-auth-wrapper">
      <div className="user-auth-card">
        <div className="user-auth-header">
          <Link to="/" className="user-auth-logo">
            <div className="logo-circle">SL</div>
            <span>Sport Lebanon</span>
          </Link>
        </div>

        <h1 className="user-auth-title">Welcome Back</h1>
        <p className="user-auth-subtitle">Log in to manage your bookings</p>

        {error && <div className="user-auth-error">{error}</div>}

        <form onSubmit={handleLogin} className="user-auth-form">
          <div className="user-auth-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="user-auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="user-auth-btn" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="user-auth-footer">
          <p>
            <Link to="/forgot-password" className="user-auth-link">
              Forgot your password?
            </Link>
          </p>
          <p style={{ marginTop: 12 }}>
            Don't have an account?{" "}
            <Link to="/register" className="user-auth-link">
              Sign up
            </Link>
          </p>
        </div>

        <div className="user-auth-divider">
          <span>or</span>
        </div>

        <div className="user-auth-alt-links">
          <Link to="/owner/login" className="user-auth-alt-link">
            I'm a Field Owner →
          </Link>
        </div>
      </div>
    </div>
  );
}

