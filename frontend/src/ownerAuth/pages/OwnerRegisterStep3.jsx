import "./../auth.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

function OwnerRegisterStep3() {
  const navigate = useNavigate();
  const location = useLocation();

  // اجلب ownerId من URL أو من localStorage
  const queryParams = new URLSearchParams(location.search);
  const ownerId = queryParams.get("ownerId") || localStorage.getItem("ownerId");

  const [idCard, setIdCard] = useState(null);
  const [businessProof, setBusinessProof] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!ownerId) {
      setError("Owner ID missing. Please restart registration.");
      return;
    }

    if (!idCard || !businessProof) {
      setError("Please upload all required documents.");
      return;
    }

    setLoading(true);

    try {
      // تجهيز FormData للملفات
      const formData = new FormData();
      formData.append("idCard", idCard);
      formData.append("businessProof", businessProof);

      // إرسال الملفات إلى السيرفر
      const response = await fetch(
        `http://localhost:5000/api/owner/register/upload/${ownerId}`,
        {
          method: "PUT",
          body: formData, // ملاحظة: لا نضع Content-Type هنا!
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Error uploading documents.");
        setLoading(false);
        return;
      }

      // بعد نجاح الرفع → الانتقال لصفحة Pending
      navigate("/owner/pending");

    } catch (err) {
      console.log(err);
      setError("Server connection failed.");
    }

    setLoading(false);
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">Verification Documents</h1>
        <p className="auth-subtitle">Upload your identity and business proof.</p>

        {error && (
          <p style={{ color: "red", marginBottom: 10 }}>{error}</p>
        )}

        <form onSubmit={handleSubmit}>
          <label>Upload ID Card</label>
          <input
            className="auth-input"
            type="file"
            onChange={(e) => setIdCard(e.target.files[0])}
            required
          />

          <label>Upload Business Proof</label>
          <input
            className="auth-input"
            type="file"
            onChange={(e) => setBusinessProof(e.target.files[0])}
            required
          />

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Uploading..." : "Submit for Review"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OwnerRegisterStep3;
