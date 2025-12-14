import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import "./UserAuth.css";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/users/verify-reset-token/${token}`);
        const data = await res.json();
        
        if (data.valid) {
          setTokenValid(true);
        } else {
          setMessage({ type: "error", text: "Invalid or expired reset link" });
        }
      } catch (err) {
        setMessage({ type: "error", text: "Failed to verify reset link" });
      }
      setVerifying(false);
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("http://localhost:5000/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Password reset successfully! Redirecting to login..." });
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to reset password" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    }

    setLoading(false);
  };

  if (verifying) {
    return (
      <div className="user-auth-wrapper">
        <div className="user-auth-card">
          <div className="user-auth-header">
            <Link to="/" className="user-auth-logo">
              <div className="logo-circle">SL</div>
              <span>Sport Lebanon</span>
            </Link>
          </div>
          <p style={{ textAlign: "center", color: "#64748b" }}>Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="user-auth-wrapper">
        <div className="user-auth-card">
          <div className="user-auth-header">
            <Link to="/" className="user-auth-logo">
              <div className="logo-circle">SL</div>
              <span>Sport Lebanon</span>
            </Link>
          </div>
          <h1 className="user-auth-title">Invalid Link</h1>
          <p className="user-auth-subtitle">
            This password reset link is invalid or has expired.
          </p>
          <div className="user-auth-footer">
            <Link to="/forgot-password" className="user-auth-link">
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-auth-wrapper">
      <div className="user-auth-card">
        <div className="user-auth-header">
          <Link to="/" className="user-auth-logo">
            <div className="logo-circle">SL</div>
            <span>Sport Lebanon</span>
          </Link>
        </div>

        <h1 className="user-auth-title">Reset Password</h1>
        <p className="user-auth-subtitle">Enter your new password</p>

        {message && (
          <div className={`user-auth-${message.type === "success" ? "success" : "error"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="user-auth-form">
          <div className="user-auth-field">
            <label>New Password</label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="user-auth-field">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="user-auth-btn" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

