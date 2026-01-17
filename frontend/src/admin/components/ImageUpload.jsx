import { useState, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";


export default function ImageUpload({ value, onChange, label = "Image" }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || "");
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_BASE}/api/admin/cms/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onChange(data.fullUrl || data.imageUrl);
        setPreview(data.fullUrl || `${API_BASE}/${data.imageUrl}`);
      } else {
        console.error("Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    onChange(url);
    setPreview(url);
  };

  // Determine if value is a URL or local path
  const displayUrl = value?.startsWith("http") 
    ? value 
    : value 
      ? `${API_BASE}/${value}` 
      : "";

  return (
    <div className="image-upload-container">
      <label className="admin-form-label">{label}</label>
      
      {/* Preview */}
      {(preview || displayUrl) && (
        <div className="image-preview" style={{ marginBottom: 12 }}>
          <img
            src={preview || displayUrl}
            alt="Preview"
            style={{
              width: "100%",
              maxWidth: 300,
              height: 120,
              objectFit: "cover",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
            }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      )}

      {/* Upload Button */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
        <input
          type="file"
          ref={fileRef}
          accept="image/*"
          onChange={handleUpload}
          style={{ display: "none" }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            padding: "8px 16px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.7 : 1,
          }}
        >
          {uploading ? "Uploading..." : "📤 Upload Image"}
        </button>
        <span style={{ fontSize: 12, color: "#64748b" }}>or enter URL below</span>
      </div>

      {/* URL Input */}
      <input
        type="text"
        className="admin-form-input"
        value={value || ""}
        onChange={handleUrlChange}
        placeholder="https://example.com/image.jpg"
      />
    </div>
  );
}

