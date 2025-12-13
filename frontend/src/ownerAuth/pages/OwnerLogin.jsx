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

      if (!response.ok) {
        setError(data.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      if (data.status === "approved") {
        localStorage.setItem("ownerToken", data.token);
        localStorage.setItem("ownerId", data.owner._id);
        localStorage.setItem("ownerName", data.owner.fullName || "");

        navigate("/owner/dashboard");
      } 
      
      else if (data.status === "pending") {
        navigate("/owner/pending");
      }

      else if (data.status === "rejected") {
        setError("Your application was rejected.");
      }

      else {
        setError("Unknown server response.");
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
