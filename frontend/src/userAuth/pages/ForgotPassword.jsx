import { useState } from "react";
import { Link } from "react-router-dom";
import "./UserAuth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("http://localhost:5000/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      setMessage({
        type: "success",
        text: "If an account exists with this email, you will receive a password reset link.",
      });
      
      // In development, show the reset link
      if (data.resetLink) {
        console.log("Reset link:", data.resetLink);
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
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

        <h1 className="user-auth-title">Forgot Password</h1>
        <p className="user-auth-subtitle">
          Enter your email and we'll send you a reset link
        </p>

        {message && (
          <div className={`user-auth-${message.type === "success" ? "success" : "error"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="user-auth-form">
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

          <button type="submit" className="user-auth-btn" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="user-auth-footer">
          <p>
            Remember your password?{" "}
            <Link to="/login" className="user-auth-link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

