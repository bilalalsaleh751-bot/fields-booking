import "./../auth.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function OwnerPendingApproval() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  async function checkStatus() {
    setChecking(true);
    setError("");

    try {
      const ownerId = localStorage.getItem("ownerId"); // لو خزنّاه بعد الـ Login

      if (!ownerId) {
        setError("Unable to check status. Please login again.");
        setChecking(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/owner/status/${ownerId}`
      );

      const data = await response.json();

      if (data.status === "approved") {
        navigate("/owner/dashboard");
      } 
      else if (data.status === "rejected") {
        setError("Your application was rejected: " + data.reason);
      } 
      else {
        setError("Still under review. Try again later.");
      }

    } catch (err) {
      console.log(err);
      setError("Could not check status.");
    }

    setChecking(false);
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">Pending Approval</h1>
        <p className="auth-subtitle">
          Your account is under review.
          You will be notified once the administration approves your documents.
        </p>

        {error && (
          <div style={{ color: "red", marginTop: "10px" }}>{error}</div>
        )}

        <div style={{ marginTop: "20px", fontSize: "14px", color: "#6b7280" }}>
          This process may take up to 24 hours.
        </div>

        <button 
          className="auth-btn" 
          style={{ marginTop: "20px" }} 
          onClick={checkStatus}
          disabled={checking}
        >
          {checking ? "Checking..." : "Check Status"}
        </button>
      </div>
    </div>
  );
}

export default OwnerPendingApproval;
