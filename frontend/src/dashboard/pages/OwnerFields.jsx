// src/dashboard/pages/OwnerFields.jsx
import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import MapPicker from "../components/MapPicker";
import AvailabilityCalendar from "../components/AvailabilityCalendar";
import {
  SPORT_TYPES,
  SURFACE_TYPES,
  CITIES_LIST,
  MAX_PLAYERS_OPTIONS,
  PRICE_RANGES,
  AMENITIES,
} from "../../constants/filterOptions";
import "../dashboard.css";

const inputStyle = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  fontSize: "13px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  marginBottom: 4,
  fontSize: 12,
  fontWeight: 600,
  color: "#475569",
};

const sectionStyle = {
  marginBottom: 20,
  padding: 16,
  background: "#f8fafc",
  borderRadius: 10,
  border: "1px solid #e2e8f0",
};

const sectionTitleStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: "#0f172a",
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: "1px solid #e2e8f0",
};

const emptyFormState = {
  name: "",
  description: "",
  sportType: "",
  pricePerHour: "",
  city: "",
  area: "",
  address: "",
  isIndoor: false,
  surfaceType: "",
  maxPlayers: "",
  openingHours: { open: "08:00", close: "23:00" },
  allowedDurations: [1, 1.5, 2, 3],
  amenities: [],
  rules: [],
  currency: "USD",
  location: { lat: "", lng: "" },
  isActive: true,
};

function OwnerFields() {
  const location = useLocation();
  
  const [ownerName, setOwnerName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(true);

  // Unified mode: "list" | "create" | "edit"
  const [mode, setMode] = useState("list");
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [editingFieldData, setEditingFieldData] = useState(null); // For images/availability
  
  // Single unified form state
  const [form, setForm] = useState({ ...emptyFormState });
  const [saving, setSaving] = useState(false);
  
  // Form error state
  const [formError, setFormError] = useState("");

  // Blocking state
  const [blockDate, setBlockDate] = useState("");

  // Image state
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deletingImage, setDeletingImage] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  // Availability calendar state
  const [showAvailabilityCalendar, setShowAvailabilityCalendar] = useState(false);
  const [availabilityFieldId, setAvailabilityFieldId] = useState(null);
  const [availabilityFieldData, setAvailabilityFieldData] = useState(null);
  
  // Open availability calendar from list view
  const openAvailabilityFromList = (field) => {
    console.log("Opening availability for field:", field._id, field.name);
    setAvailabilityFieldId(field._id);
    setAvailabilityFieldData(field);
    setShowAvailabilityCalendar(true);
    console.log("Availability calendar should now be visible");
  };
  
  // Validate form before submission
  const validateForm = () => {
    // Required fields
    if (!form.name?.trim()) {
      return "Field name is required";
    }
    if (!form.sportType?.trim()) {
      return "Sport type is required";
    }
    if (!form.pricePerHour || Number(form.pricePerHour) <= 0) {
      return "Price per hour must be greater than 0";
    }
    
    // Location is REQUIRED
    const lat = parseFloat(form.location?.lat);
    const lng = parseFloat(form.location?.lng);
    if (isNaN(lat) || isNaN(lng)) {
      return "Location is required. Please click on the map to set field location.";
    }
    if (lat < -90 || lat > 90) {
      return "Invalid latitude. Please select a valid location on the map.";
    }
    if (lng < -180 || lng > 180) {
      return "Invalid longitude. Please select a valid location on the map.";
    }
    
    return null; // No errors
  };

  useEffect(() => {
    const storedName = localStorage.getItem("ownerName");
    const storedId = localStorage.getItem("ownerId");
    console.log("OwnerFields: Retrieved from localStorage - ownerId:", storedId, "ownerName:", storedName);
    if (storedName) setOwnerName(storedName);
    if (storedId) setOwnerId(storedId);
  }, []);

  const getToken = () => localStorage.getItem("ownerToken") || "";

  const fetchFields = useCallback(async () => {
    if (!ownerId) return;
    try {
      setLoadingFields(true);
      const res = await fetch(`http://localhost:5000/api/fields?ownerId=${ownerId}`);
      const data = await res.json();
      if (res.ok) setFields(data.fields || []);
    } catch (err) {
      // Silent fail for fetch - fields will just be empty
    } finally {
      setLoadingFields(false);
    }
  }, [ownerId]);

  // Fetch fields on mount and when navigating back
  useEffect(() => {
    fetchFields();
  }, [fetchFields, location.key]);

  // Switch to create mode
  const handleAddNew = () => {
    setForm({ ...emptyFormState });
    setEditingFieldId(null);
    setEditingFieldData(null);
    setImagePreviews([]);
    setFormError(""); // Clear any previous errors
    setMode("create");
  };

  // Switch to edit mode
  const handleEdit = (field) => {
    console.log("Editing field:", field._id, field.name);
    
    // Populate form with field data
    const formData = {
      name: field.name || "",
      description: field.description || "",
      sportType: field.sportType || field.sport || "",
      pricePerHour: field.pricePerHour || "",
      city: field.city || "",
      area: field.area || "",
      address: field.address || "",
      isIndoor: field.isIndoor || false,
      surfaceType: field.surfaceType || "",
      maxPlayers: field.maxPlayers || "",
      openingHours: field.openingHours || { open: "08:00", close: "23:00" },
      allowedDurations: field.allowedDurations || [1, 1.5, 2, 3],
      amenities: field.amenities || [],
      rules: field.rules || [],
      currency: field.currency || "USD",
      location: field.location || { lat: "", lng: "" },
      isActive: field.isActive !== false,
    };
    
    console.log("Form data:", formData);
    
    setForm(formData);
    setEditingFieldId(field._id);
    setEditingFieldData(field);
    setImagePreviews([]);
    setFormError(""); // Clear any previous errors
    setMode("edit");
    
    console.log("Mode set to edit");
  };

  // Cancel and go back to list
  const handleCancel = () => {
    setMode("list");
    setEditingFieldId(null);
    setEditingFieldData(null);
    setForm({ ...emptyFormState });
    setImagePreviews([]);
    setFormError(""); // Clear any errors when canceling
  };

  // Save (create or update)
  const handleSave = async (e) => {
    e.preventDefault();
    console.log("handleSave called, mode:", mode);
    setFormError(""); // Clear previous errors
    
    // Check owner ID
    if (!ownerId) {
      console.error("No ownerId found");
      setFormError("Owner ID not found. Please log in again.");
      return;
    }
    
    // Validate form BEFORE submission
    const validationError = validateForm();
    if (validationError) {
      console.error("Validation error:", validationError);
      setFormError(validationError);
      return;
    }
    
    try {
      setSaving(true);
      const token = getToken();
      console.log("Token available:", !!token);
      
      // Prepare payload with proper location handling
      const payload = {
        ...form,
        pricePerHour: Number(form.pricePerHour),
        maxPlayers: form.maxPlayers ? Number(form.maxPlayers) : null,
        // Location is validated, convert to numbers
        location: {
          lat: parseFloat(form.location.lat),
          lng: parseFloat(form.location.lng),
        },
      };

      console.log("Payload:", payload);

      let res;
      if (mode === "create") {
        console.log("Creating new field...");
        res = await fetch("http://localhost:5000/api/fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerId, ...payload }),
        });
      } else {
        console.log("Updating field:", editingFieldId);
        res = await fetch(`http://localhost:5000/api/fields/${editingFieldId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      console.log("Response:", res.status, data);
      
      if (res.ok && (res.status === 201 || res.status === 200)) {
        console.log("Save successful");
        setFormError("");
        await fetchFields();
        handleCancel();
      } else {
        console.error("Save failed:", data);
        setFormError(data.message || `Failed to save field (${res.status}). Please try again.`);
      }
    } catch (err) {
      console.error("Save error:", err);
      setFormError("Network error. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  // Toggle field active status
  const toggleActive = async (fieldId, isActive) => {
    try {
      const token = getToken();
      if (!token) {
        alert("Please log in again - no authentication token found");
        return;
      }
      
      const endpoint = isActive ? "deactivate" : "activate";
      console.log(`Toggling field ${fieldId} to ${endpoint}`);
      
      const res = await fetch(`http://localhost:5000/api/fields/${fieldId}/${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log(`Field ${endpoint}d successfully`);
        fetchFields();
      } else {
        console.error("Toggle failed:", data);
        alert(data.message || `Failed to ${endpoint} field`);
      }
    } catch (err) {
      console.error("Toggle error:", err);
      alert("Network error - please check your connection");
    }
  };

  // Image handlers
  const handleFileSelect = (files) => {
    if (!files?.length) return;
    const previews = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setImagePreviews(previews);
  };

  const clearPreviews = () => {
    imagePreviews.forEach((p) => URL.revokeObjectURL(p.url));
    setImagePreviews([]);
  };

  const handleImageUpload = async () => {
    if (!imagePreviews.length || !editingFieldId) return;
    try {
      setUploadingImages(true);
      const formData = new FormData();
      imagePreviews.forEach((p) => formData.append("images", p.file));
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/fields/${editingFieldId}/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        clearPreviews();
        await fetchFields();
        const fieldRes = await fetch(`http://localhost:5000/api/fields/${editingFieldId}`);
        if (fieldRes.ok) {
          const updatedField = await fieldRes.json();
          setEditingFieldData(updatedField);
        }
      } else {
        const err = await res.json();
        alert(err.message || "Failed to upload images");
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const handleImageDelete = async (imagePath) => {
    if (!confirm("Delete this image?")) return;
    try {
      setDeletingImage(imagePath);
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/fields/${editingFieldId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imagePath }),
      });
      if (res.ok) {
        await fetchFields();
        const fieldRes = await fetch(`http://localhost:5000/api/fields/${editingFieldId}`);
        if (fieldRes.ok) {
          const data = await fieldRes.json();
          setEditingFieldData(data);
        }
      } else {
        const err = await res.json();
        alert(err.message || "Failed to delete image");
      }
    } finally {
      setDeletingImage(null);
    }
  };

  // Availability blocking
  const handleBlockDate = async () => {
    if (!blockDate || !editingFieldId) return;
    const token = getToken();
    await fetch(`http://localhost:5000/api/fields/${editingFieldId}/block-dates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ dates: [blockDate] }),
    });
    setBlockDate("");
    await fetchFields();
    const res = await fetch(`http://localhost:5000/api/fields/${editingFieldId}`);
    if (res.ok) {
      const data = await res.json();
      setEditingFieldData(data);
    }
  };

  const handleUnblockDate = async (date) => {
    const token = getToken();
    await fetch(`http://localhost:5000/api/fields/${editingFieldId}/unblock-dates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ dates: [date] }),
    });
    await fetchFields();
    const res = await fetch(`http://localhost:5000/api/fields/${editingFieldId}`);
    if (res.ok) {
      const data = await res.json();
      setEditingFieldData(data);
    }
  };

  // Toggle duration in form
  const toggleDuration = (dur) => {
    setForm((p) => ({
      ...p,
      allowedDurations: p.allowedDurations.includes(dur)
        ? p.allowedDurations.filter((d) => d !== dur)
        : [...p.allowedDurations, dur].sort((a, b) => a - b),
    }));
  };

  // ============================================
  // RENDER: LIST MODE
  // ============================================
  if (mode === "list") {
  return (
    <>
        <DashboardHeader ownerName={ownerName} onAddField={handleAddNew} />

        {loadingFields && (
          <div className="dashboard-panel">
            <p className="dashboard-loading">Loading fields…</p>
          </div>
        )}

        {!loadingFields && fields.length === 0 && (
          <div className="dashboard-panel">
            <p style={{ textAlign: "center", color: "#64748b", padding: 40, margin: 0 }}>
              No fields yet. Click "Add Field" to create your first field.
            </p>
          </div>
        )}

        {!loadingFields && fields.map((f) => (
          <div key={f._id} className="dashboard-panel" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* Thumbnail */}
                <div style={{ width: 80, height: 60, borderRadius: 8, overflow: "hidden", background: "#e2e8f0", flexShrink: 0 }}>
                  {f.mainImage || f.images?.[0] ? (
                    <img src={`http://localhost:5000/${f.mainImage || f.images[0]}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 10 }}>No image</div>
                  )}
                </div>
                
                {/* Info */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{f.name}</h3>
                    <span className={`badge ${f.isActive ? "badge-success" : "badge-danger"}`} style={{ fontSize: 10 }}>
                      {f.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                    {f.sportType || f.sport} • ${f.pricePerHour}/hr • {f.city || "No location"} • {f.images?.length || 0} images
                  </p>
                </div>
              </div>
              
              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openAvailabilityFromList(f)} className="dashboard-date-pill" style={{ fontSize: 11, padding: "6px 12px" }}>
                  📅 Availability
                </button>
                <button onClick={() => toggleActive(f._id, f.isActive)} className="dashboard-date-pill" style={{ fontSize: 11, padding: "6px 12px" }}>
                  {f.isActive ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => handleEdit(f)} className="dashboard-primary-btn" style={{ fontSize: 11, padding: "6px 16px" }}>
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {/* Availability Calendar Modal (list mode) */}
        {showAvailabilityCalendar && availabilityFieldId && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}>
            <div style={{ width: "100%", maxWidth: 800, maxHeight: "90vh", overflow: "auto", margin: 20 }}>
              <AvailabilityCalendar
                fieldId={availabilityFieldId}
                openingHours={availabilityFieldData?.openingHours}
                onClose={async () => {
                  setShowAvailabilityCalendar(false);
                  setAvailabilityFieldId(null);
                  setAvailabilityFieldData(null);
                  // Refresh fields list
                  await fetchFields();
                }}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // ============================================
  // RENDER: CREATE / EDIT MODE (UNIFIED FORM)
  // ============================================
  return (
    <>
      <DashboardHeader ownerName={ownerName} onAddField={handleAddNew} />

      <div className="dashboard-panel" style={{ marginBottom: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "2px solid #e2e8f0" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
              {mode === "create" ? "Add New Field" : `Edit: ${form.name || "Field"}`}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
              {mode === "create" ? "Fill in all details to create a new field" : "Update field information, images, and availability"}
            </p>
          </div>
          <button onClick={handleCancel} className="dashboard-date-pill" style={{ fontSize: 12 }}>
            ← Back to List
          </button>
        </div>

        {/* ERROR BANNER */}
        {formError && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <p style={{ margin: 0, color: "#dc2626", fontWeight: 600, fontSize: 14 }}>
                Form Error
              </p>
              <p style={{ margin: "4px 0 0", color: "#b91c1c", fontSize: 13 }}>
                {formError}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormError("")}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: "#dc2626",
                fontSize: 18,
                cursor: "pointer",
                padding: 4,
              }}
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* SECTION 1: Basic Information */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>📋 Basic Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Field Name *</label>
                <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>Sport Type *</label>
                <select 
                  style={inputStyle} 
                  value={form.sportType} 
                  onChange={(e) => setForm({ ...form, sportType: e.target.value })} 
                  required
                >
                  <option value="">Select sport type</option>
                  {SPORT_TYPES.map((sport) => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Price/Hour (USD) *</label>
                <select 
                  style={inputStyle} 
                  value={form.pricePerHour} 
                  onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })} 
                  required
                >
                  <option value="">Select price</option>
                  {PRICE_RANGES.map((price) => (
                    <option key={price} value={price}>${price}/hr</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Surface Type</label>
                <select 
                  style={inputStyle} 
                  value={form.surfaceType} 
                  onChange={(e) => setForm({ ...form, surfaceType: e.target.value })}
                >
                  <option value="">Select surface type</option>
                  {SURFACE_TYPES.map((surface) => (
                    <option key={surface} value={surface}>{surface}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Max Players</label>
                <select 
                  style={inputStyle} 
                  value={form.maxPlayers} 
                  onChange={(e) => setForm({ ...form, maxPlayers: e.target.value })}
                >
                  <option value="">Select max players</option>
                  {MAX_PLAYERS_OPTIONS.map((num) => (
                    <option key={num} value={num}>{num} players</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select style={inputStyle} value={form.isIndoor ? "indoor" : "outdoor"} onChange={(e) => setForm({ ...form, isIndoor: e.target.value === "indoor" })}>
                  <option value="outdoor">Outdoor</option>
                  <option value="indoor">Indoor</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your field..." />
            </div>
          </div>

          {/* SECTION 2: Location */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>📍 Location <span style={{ color: "#dc2626", fontSize: 12 }}>*Required</span></h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>City *</label>
                <select 
                  style={inputStyle} 
                  value={form.city} 
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                >
                  <option value="">Select city</option>
                  {CITIES_LIST.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Area</label>
                <input 
                  style={inputStyle} 
                  value={form.area} 
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  placeholder="Enter area name..."
                />
              </div>
              <div>
                <label style={labelStyle}>Street Address</label>
                <input style={inputStyle} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address (optional)" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>
                Map Location (click to set) <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <div style={{
                border: (!form.location?.lat || !form.location?.lng) && formError ? "2px solid #dc2626" : "none",
                borderRadius: 10,
              }}>
                <MapPicker
                  lat={form.location?.lat ? parseFloat(form.location.lat) : null}
                  lng={form.location?.lng ? parseFloat(form.location.lng) : null}
                  onChange={(coords) => {
                    // Use functional update to avoid stale closure
                    setForm(prevForm => ({ ...prevForm, location: coords }));
                    // Clear location-related error
                    setFormError(prevError => 
                      prevError && prevError.includes("Location") ? "" : prevError
                    );
                  }}
                />
              </div>
              {form.location?.lat && form.location?.lng ? (
                <p style={{ fontSize: 11, color: "#22c55e", marginTop: 4, fontWeight: 500 }}>
                  ✓ Location set: {form.location.lat}, {form.location.lng}
                </p>
              ) : (
                <p style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>
                  ⚠️ Click on the map to set field location (required)
                </p>
              )}
            </div>
          </div>

          {/* SECTION 3: Opening Hours & Durations */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>⏰ Schedule & Booking</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Opening Time</label>
                <input type="time" style={inputStyle} value={form.openingHours.open} onChange={(e) => setForm({ ...form, openingHours: { ...form.openingHours, open: e.target.value } })} />
              </div>
              <div>
                <label style={labelStyle}>Closing Time</label>
                <input type="time" style={inputStyle} value={form.openingHours.close} onChange={(e) => setForm({ ...form, openingHours: { ...form.openingHours, close: e.target.value } })} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Allowed Booking Durations (hours)</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {[0.5, 1, 1.5, 2, 2.5, 3, 4].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDuration(d)}
                    style={{
                      padding: "8px 16px",
                      fontSize: 13,
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      cursor: "pointer",
                      background: form.allowedDurations.includes(d) ? "#22c55e" : "white",
                      color: form.allowedDurations.includes(d) ? "white" : "#374151",
                      fontWeight: 500,
                    }}
                  >
                    {d}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: Amenities & Rules */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>✨ Amenities & Rules</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Amenities */}
              <div>
                <label style={labelStyle}>Amenities</label>
                <div style={{ display: "flex", gap: 8, marginTop: 6, marginBottom: 8 }}>
              <input
                    id="formAmenity"
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="e.g., Parking, Floodlights"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = e.target.value.trim();
                        if (val && !form.amenities.includes(val)) {
                          setForm({ ...form, amenities: [...form.amenities, val] });
                          e.target.value = "";
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("formAmenity");
                      const val = input.value.trim();
                      if (val && !form.amenities.includes(val)) {
                        setForm({ ...form, amenities: [...form.amenities, val] });
                        input.value = "";
                      }
                    }}
                    className="dashboard-date-pill"
                  >
                    Add
                  </button>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {form.amenities.map((a, i) => (
                    <span key={i} style={{ background: "#eef2ff", color: "#4f46e5", padding: "4px 10px", borderRadius: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      {a}
                      <button type="button" onClick={() => setForm({ ...form, amenities: form.amenities.filter((_, idx) => idx !== i) })} style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, padding: 0 }}>×</button>
                    </span>
                  ))}
                  {form.amenities.length === 0 && <span style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No amenities</span>}
                </div>
              </div>

              {/* Rules */}
              <div>
                <label style={labelStyle}>Rules</label>
                <div style={{ display: "flex", gap: 8, marginTop: 6, marginBottom: 8 }}>
              <input
                    id="formRule"
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="e.g., No smoking"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = e.target.value.trim();
                        if (val && !form.rules.includes(val)) {
                          setForm({ ...form, rules: [...form.rules, val] });
                          e.target.value = "";
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("formRule");
                      const val = input.value.trim();
                      if (val && !form.rules.includes(val)) {
                        setForm({ ...form, rules: [...form.rules, val] });
                        input.value = "";
                      }
                    }}
                    className="dashboard-date-pill"
                  >
                    Add
                  </button>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {form.rules.map((r, i) => (
                    <span key={i} style={{ background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      {r}
                      <button type="button" onClick={() => setForm({ ...form, rules: form.rules.filter((_, idx) => idx !== i) })} style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, padding: 0 }}>×</button>
                    </span>
                  ))}
                  {form.rules.length === 0 && <span style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No rules</span>}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: Images (Edit Mode Only) */}
          {mode === "edit" && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>🖼️ Images</h3>
              
              {/* Upload */}
              <div style={{ marginBottom: 16, padding: 16, background: "#fff", borderRadius: 8, border: "1px dashed #cbd5e1" }}>
                <label style={labelStyle}>Upload New Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  disabled={uploadingImages}
                  style={inputStyle}
                />
                
                {imagePreviews.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Preview ({imagePreviews.length} selected):</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginBottom: 12 }}>
                      {imagePreviews.map((preview, i) => (
                        <div key={i} style={{ position: "relative", borderRadius: 6, overflow: "hidden", border: "2px solid #22c55e" }}>
                          <img src={preview.url} alt={preview.name} style={{ width: "100%", height: 80, objectFit: "cover" }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" onClick={handleImageUpload} disabled={uploadingImages} className="dashboard-primary-btn" style={{ fontSize: 12 }}>
                        {uploadingImages ? "Uploading..." : `Upload ${imagePreviews.length} Images`}
                      </button>
                      <button type="button" onClick={clearPreviews} className="dashboard-date-pill" style={{ fontSize: 12 }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Existing Images */}
              <div>
                <label style={labelStyle}>Current Images ({editingFieldData?.images?.length || 0})</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10, marginTop: 8 }}>
                  {editingFieldData?.images?.map((img, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                      <img src={`http://localhost:5000/${img}`} alt="" style={{ width: "100%", height: 100, objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => handleImageDelete(img)}
                        disabled={deletingImage === img}
                        style={{ position: "absolute", top: 4, right: 4, background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: 22, height: 22, fontSize: 12, cursor: "pointer" }}
                      >
                        ×
                      </button>
                      {i === 0 && (
                        <span style={{ position: "absolute", bottom: 4, left: 4, background: "#2563eb", color: "white", fontSize: 9, padding: "2px 6px", borderRadius: 4 }}>Main</span>
                      )}
                    </div>
                  ))}
                </div>
                {(!editingFieldData?.images || editingFieldData.images.length === 0) && (
                  <p style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", marginTop: 8 }}>No images uploaded</p>
                )}
              </div>
            </div>
          )}

          {/* SECTION 6: Availability (Edit Mode Only) */}
          {mode === "edit" && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>📅 Availability</h3>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
                Block specific dates or time slots to prevent customer bookings.
              </p>
              
              {/* Quick stats */}
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ background: "#fef2f2", padding: "8px 14px", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#dc2626" }}>
                    {editingFieldData?.blockedDates?.length || 0}
                  </span>
                  <span style={{ fontSize: 12, color: "#dc2626" }}>Blocked Days</span>
                </div>
                <div style={{ background: "#fffbeb", padding: "8px 14px", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#d97706" }}>
                    {editingFieldData?.blockedTimeSlots?.reduce((acc, e) => acc + (e.timeSlots?.length || 0), 0) || 0}
                  </span>
                  <span style={{ fontSize: 12, color: "#d97706" }}>Blocked Slots</span>
                </div>
            </div>

              {/* Open Calendar Button */}
              <button
                type="button"
                onClick={() => setShowAvailabilityCalendar(true)}
                className="dashboard-primary-btn"
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <span>📅</span>
                <span>Manage Availability Calendar</span>
              </button>
              
              {/* Blocked dates preview */}
              {editingFieldData?.blockedDates?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <label style={labelStyle}>Upcoming Blocked Dates</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                    {editingFieldData.blockedDates.slice(0, 10).map((d, i) => (
                      <span key={i} style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 10px", borderRadius: 6, fontSize: 12 }}>
                        {d}
                      </span>
                    ))}
                    {editingFieldData.blockedDates.length > 10 && (
                      <span style={{ fontSize: 12, color: "#64748b" }}>+{editingFieldData.blockedDates.length - 10} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Availability Calendar Modal (edit mode) */}
          {showAvailabilityCalendar && editingFieldId && mode === "edit" && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}>
              <div style={{ width: "100%", maxWidth: 800, maxHeight: "90vh", overflow: "auto", margin: 20 }}>
                <AvailabilityCalendar
                  fieldId={editingFieldId}
                  openingHours={form.openingHours}
                  onClose={async () => {
                    setShowAvailabilityCalendar(false);
                    // Refresh field data to show updated blocked dates
                    await fetchFields();
                    const token = getToken();
                    const fieldRes = await fetch(`http://localhost:5000/api/fields/${editingFieldId}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (fieldRes.ok) {
                      const updatedField = await fieldRes.json();
                      setEditingFieldData(updatedField);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* SECTION 7: Status (Edit Mode Only) */}
          {mode === "edit" && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>⚡ Status</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 13, color: "#475569" }}>Field is currently:</span>
                <span className={`badge ${editingFieldData?.isActive ? "badge-success" : "badge-danger"}`} style={{ fontSize: 12 }}>
                  {editingFieldData?.isActive ? "Active" : "Inactive"}
                </span>
                <button
                  type="button"
                  onClick={() => toggleActive(editingFieldId, editingFieldData?.isActive)}
                  className="dashboard-date-pill"
                  style={{ marginLeft: 8 }}
                >
                  {editingFieldData?.isActive ? "Deactivate Field" : "Activate Field"}
                </button>
              </div>
            </div>
          )}

          {/* SAVE BUTTON */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 20, borderTop: "2px solid #e2e8f0", marginTop: 8 }}>
            <button type="button" onClick={handleCancel} className="dashboard-date-pill" style={{ padding: "10px 24px", fontSize: 14 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="dashboard-primary-btn" style={{ padding: "10px 32px", fontSize: 14 }}>
              {saving ? "Saving..." : mode === "create" ? "Create Field" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default OwnerFields;
