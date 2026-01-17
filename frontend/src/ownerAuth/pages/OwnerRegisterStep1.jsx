import "./../auth.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";


function OwnerRegisterStep1() {
  const navigate = useNavigate();

  // State variables
  const [fullName, setFullName] = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleNext(e) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/owner/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Something went wrong");
        setLoading(false);
        return;
      }

      // Save ownerId in localStorage for later steps
      localStorage.setItem("ownerId", data.ownerId);

      // Go to Step 2
      navigate(`/owner/register/details?ownerId=${data.ownerId}`);

    } catch (err) {
      console.log(err);
      setError("Server error. Try again.");
    }

    setLoading(false);
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">Create Owner Account</h1>
        <p className="auth-subtitle">
          Start by entering your basic information.
        </p>

        {error && (
          <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>
        )}

        <form onSubmit={handleNext}>
          <input
            className="auth-input"
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

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
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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

          <input
            className="auth-input"
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Next"}
          </button>
        </form>

        <div className="auth-note">
          Already have an account?{" "}
          <span className="auth-link" onClick={() => navigate("/owner/login")}>
            Login
          </span>
        </div>
      </div>
    </div>
  );
}

export default OwnerRegisterStep1;
