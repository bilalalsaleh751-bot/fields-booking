import "./../auth.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";


function OwnerRegisterStep2() {
  const navigate = useNavigate();
  const location = useLocation();

  // نجلب ownerId من localStorage أو من URL
  const queryParams = new URLSearchParams(location.search);
  const ownerId = queryParams.get("ownerId") || localStorage.getItem("ownerId");

  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [sportsType, setSportsType] = useState("");
  const [commercialRecord, setCommercialRecord] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  async function handleNext(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!ownerId) {
      setError("Owner ID missing. Please restart registration.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/owner/register/details/${ownerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName,
            address,
            sportsType,
            commercialRecord,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Server error. Try again.");
        setLoading(false);
        return;
      }

      // لو كل شي تمام → روح للخطوة الثالثة (upload)
      navigate(`/owner/register/upload?ownerId=${ownerId}`);

    } catch (err) {
      console.log(err);
      setError("Connection error. Try again.");
    }

    setLoading(false);
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">Business Details</h1>
        <p className="auth-subtitle">Tell us more about your sports facility.</p>

        {error && <p style={{ color: "red", marginBottom: 10 }}>{error}</p>}

        <form onSubmit={handleNext}>

          <input
            className="auth-input"
            type="text"
            placeholder="Facility / Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />

          <input
            className="auth-input"
            type="text"
            placeholder="Location Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />

          <input
            className="auth-input"
            type="text"
            placeholder="Sports Type (Football, Padel…)"
            value={sportsType}
            onChange={(e) => setSportsType(e.target.value)}
            required
          />

          <input
            className="auth-input"
            type="text"
            placeholder="Commercial Registration (Optional)"
            value={commercialRecord}
            onChange={(e) => setCommercialRecord(e.target.value)}
          />

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Next"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OwnerRegisterStep2;
