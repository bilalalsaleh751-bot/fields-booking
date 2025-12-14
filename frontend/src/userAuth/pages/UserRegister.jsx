import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./UserAuth.css";

export default function UserRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        setLoading(false);
        return;
      }

      // Store auth data
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userId", data.user._id);
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userEmail", data.user.email);

      // Redirect to account
      navigate("/account/bookings");
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

        <h1 className="user-auth-title">Create Account</h1>
        <p className="user-auth-subtitle">Join thousands of athletes booking courts</p>

        {error && <div className="user-auth-error">{error}</div>}

        <form onSubmit={handleRegister} className="user-auth-form">
          <div className="user-auth-field">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Your full name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="user-auth-field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="user-auth-field">
            <label>Phone (optional)</label>
            <input
              type="tel"
              name="phone"
              placeholder="+961 XX XXX XXX"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="user-auth-field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="user-auth-field">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="user-auth-btn" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="user-auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="user-auth-link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

