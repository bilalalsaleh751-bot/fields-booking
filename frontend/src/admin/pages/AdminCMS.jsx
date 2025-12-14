// src/admin/pages/AdminCMS.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ImageUpload from "../components/ImageUpload";

function AdminCMS() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("homepage");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});

  // Homepage/Footer content states
  const [homepageContent, setHomepageContent] = useState(null);
  const [footerContent, setFooterContent] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");

      if (activeTab === "homepage") {
        const res = await fetch("http://localhost:5000/api/admin/cms/homepage", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch homepage content");
        const result = await res.json();
        setHomepageContent(result.content);
      } else if (activeTab === "footer") {
        const res = await fetch("http://localhost:5000/api/admin/cms/footer", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch footer content");
        const result = await res.json();
        setFooterContent(result.content);
      } else {
        const res = await fetch(`http://localhost:5000/api/admin/cms/${activeTab}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 401) {
            navigate("/admin/login");
            return;
          }
          throw new Error("Failed to fetch data");
        }

        const result = await res.json();
        setData(result[activeTab] || result.promoCodes || []);
      }
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save homepage content
  const handleSaveHomepage = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("http://localhost:5000/api/admin/cms/homepage", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(homepageContent),
      });

      if (!res.ok) throw new Error("Failed to save homepage content");

      showToast("success", "Homepage content saved");
      fetchData();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  // Save footer content
  const handleSaveFooter = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("http://localhost:5000/api/admin/cms/footer", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(footerContent),
      });

      if (!res.ok) throw new Error("Failed to save footer content");

      showToast("success", "Footer content saved");
      fetchData();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = () => {
    setEditItem(null);
    setFormData(getDefaultForm());
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this item?")) return;

    try {
      const token = localStorage.getItem("adminToken");
      const endpoint = activeTab === "promo-codes" ? "promo-codes" : activeTab;
      const res = await fetch(`http://localhost:5000/api/admin/cms/${endpoint}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete");

      showToast("success", "Deleted successfully");
      fetchData();
    } catch (err) {
      showToast("error", err.message);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const endpoint = activeTab === "promo-codes" ? "promo-codes" : activeTab;
      const method = editItem ? "PUT" : "POST";
      const url = editItem
        ? `http://localhost:5000/api/admin/cms/${endpoint}/${editItem._id}`
        : `http://localhost:5000/api/admin/cms/${endpoint}`;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save");
      }

      showToast("success", editItem ? "Updated successfully" : "Created successfully");
      setShowModal(false);
      fetchData();
    } catch (err) {
      showToast("error", err.message);
    }
  };

  const getDefaultForm = () => {
    switch (activeTab) {
      case "banners":
        return { title: "", subtitle: "", imageUrl: "", linkUrl: "", position: "hero", isActive: true };
      case "faqs":
        return { question: "", answer: "", category: "general", isActive: true };
      case "categories":
        return { name: "", slug: "", icon: "", description: "", isActive: true };
      case "promo-codes":
        return {
          code: "",
          description: "",
          discountType: "percentage",
          discountValue: 10,
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          isActive: true,
        };
      default:
        return {};
    }
  };

  const tabs = [
    { id: "homepage", label: "Homepage" },
    { id: "footer", label: "Footer" },
    { id: "banners", label: "Banners" },
    { id: "faqs", label: "FAQs" },
    { id: "categories", label: "Categories" },
    { id: "promo-codes", label: "Promo Codes" },
  ];

  // Helper to update nested homepage content
  const updateHomepageSection = (section, key, value) => {
    setHomepageContent(prev => ({
      ...prev,
      [section]: { ...prev?.[section], [key]: value },
    }));
  };

  // Helper to update array items
  const updateHomepageArrayItem = (section, arrayKey, index, key, value) => {
    setHomepageContent(prev => ({
      ...prev,
      [section]: {
        ...prev?.[section],
        [arrayKey]: prev?.[section]?.[arrayKey]?.map((item, i) =>
          i === index ? { ...item, [key]: value } : item
        ),
      },
    }));
  };

  return (
    <div>
      {toast && (
        <div className={`admin-toast ${toast.type}`}>{toast.message}</div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-empty">Loading...</div>
      ) : (
        <>
          {/* ============ HOMEPAGE TAB ============ */}
          {activeTab === "homepage" && homepageContent && (
            <div>
              {/* Hero Section */}
              <div className="admin-card" style={{ marginBottom: 20 }}>
                <div className="admin-card-header">
                  <h3 className="admin-card-title">🎯 Hero Section</h3>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Title</label>
                  <input
                    className="admin-form-input"
                    value={homepageContent.hero?.title || ""}
                    onChange={(e) => updateHomepageSection("hero", "title", e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Subtitle</label>
                  <input
                    className="admin-form-input"
                    value={homepageContent.hero?.subtitle || ""}
                    onChange={(e) => updateHomepageSection("hero", "subtitle", e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <ImageUpload
                    label="Background Image"
                    value={homepageContent.hero?.backgroundImage || ""}
                    onChange={(url) => updateHomepageSection("hero", "backgroundImage", url)}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">CTA Button Text</label>
                  <input
                    className="admin-form-input"
                    value={homepageContent.hero?.ctaText || ""}
                    onChange={(e) => updateHomepageSection("hero", "ctaText", e.target.value)}
                  />
                </div>
              </div>

              {/* Stats Section */}
              <div className="admin-card" style={{ marginBottom: 20 }}>
                <div className="admin-card-header">
                  <h3 className="admin-card-title">📊 Stats Section</h3>
                </div>
                <div className="admin-form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={homepageContent.stats?.isEnabled !== false}
                      onChange={(e) => updateHomepageSection("stats", "isEnabled", e.target.checked)}
                    />
                    <span>Enable Stats Section</span>
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  {homepageContent.stats?.items?.map((stat, i) => (
                    <div key={i} style={{ padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                      <div className="admin-form-group" style={{ marginBottom: 8 }}>
                        <label className="admin-form-label" style={{ fontSize: 11 }}>Value</label>
                        <input
                          className="admin-form-input"
                          value={stat.value || ""}
                          onChange={(e) => updateHomepageArrayItem("stats", "items", i, "value", e.target.value)}
                          style={{ fontSize: 13 }}
                        />
                      </div>
                      <div className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label className="admin-form-label" style={{ fontSize: 11 }}>Label</label>
                        <input
                          className="admin-form-input"
                          value={stat.label || ""}
                          onChange={(e) => updateHomepageArrayItem("stats", "items", i, "label", e.target.value)}
                          style={{ fontSize: 13 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Banner */}
              <div className="admin-card" style={{ marginBottom: 20 }}>
                <div className="admin-card-header">
                  <h3 className="admin-card-title">📣 CTA Banner</h3>
                </div>
                <div className="admin-form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={homepageContent.ctaBanner?.isEnabled !== false}
                      onChange={(e) => updateHomepageSection("ctaBanner", "isEnabled", e.target.checked)}
                    />
                    <span>Enable CTA Banner</span>
                  </label>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Title</label>
                  <input
                    className="admin-form-input"
                    value={homepageContent.ctaBanner?.title || ""}
                    onChange={(e) => updateHomepageSection("ctaBanner", "title", e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Subtitle</label>
                  <input
                    className="admin-form-input"
                    value={homepageContent.ctaBanner?.subtitle || ""}
                    onChange={(e) => updateHomepageSection("ctaBanner", "subtitle", e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Button Text</label>
                  <input
                    className="admin-form-input"
                    value={homepageContent.ctaBanner?.buttonText || ""}
                    onChange={(e) => updateHomepageSection("ctaBanner", "buttonText", e.target.value)}
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleSaveHomepage}
                disabled={saving}
                style={{ marginTop: 8 }}
              >
                {saving ? "Saving..." : "Save Homepage Content"}
              </button>
            </div>
          )}

          {/* ============ FOOTER TAB ============ */}
          {activeTab === "footer" && footerContent && (
            <div>
              {/* About Section */}
              <div className="admin-card" style={{ marginBottom: 20 }}>
                <div className="admin-card-header">
                  <h3 className="admin-card-title">ℹ️ About Section</h3>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Title</label>
                  <input
                    className="admin-form-input"
                    value={footerContent.about?.title || ""}
                    onChange={(e) => setFooterContent(prev => ({
                      ...prev,
                      about: { ...prev?.about, title: e.target.value },
                    }))}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Description</label>
                  <textarea
                    className="admin-form-textarea"
                    rows={3}
                    value={footerContent.about?.description || ""}
                    onChange={(e) => setFooterContent(prev => ({
                      ...prev,
                      about: { ...prev?.about, description: e.target.value },
                    }))}
                  />
                </div>
              </div>

              {/* Contact Section */}
              <div className="admin-card" style={{ marginBottom: 20 }}>
                <div className="admin-card-header">
                  <h3 className="admin-card-title">📞 Contact Info</h3>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Email</label>
                  <input
                    className="admin-form-input"
                    value={footerContent.contact?.email || ""}
                    onChange={(e) => setFooterContent(prev => ({
                      ...prev,
                      contact: { ...prev?.contact, email: e.target.value },
                    }))}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Phone</label>
                  <input
                    className="admin-form-input"
                    value={footerContent.contact?.phone || ""}
                    onChange={(e) => setFooterContent(prev => ({
                      ...prev,
                      contact: { ...prev?.contact, phone: e.target.value },
                    }))}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Address</label>
                  <input
                    className="admin-form-input"
                    value={footerContent.contact?.address || ""}
                    onChange={(e) => setFooterContent(prev => ({
                      ...prev,
                      contact: { ...prev?.contact, address: e.target.value },
                    }))}
                  />
                </div>
              </div>

              {/* Legal Section */}
              <div className="admin-card" style={{ marginBottom: 20 }}>
                <div className="admin-card-header">
                  <h3 className="admin-card-title">⚖️ Legal</h3>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Copyright Text (use {"{year}"} for current year)</label>
                  <input
                    className="admin-form-input"
                    value={footerContent.legal?.copyrightText || ""}
                    onChange={(e) => setFooterContent(prev => ({
                      ...prev,
                      legal: { ...prev?.legal, copyrightText: e.target.value },
                    }))}
                  />
                </div>
              </div>

              {/* Newsletter Section */}
              <div className="admin-card" style={{ marginBottom: 20 }}>
                <div className="admin-card-header">
                  <h3 className="admin-card-title">📧 Newsletter</h3>
                </div>
                <div className="admin-form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={footerContent.newsletter?.isEnabled !== false}
                      onChange={(e) => setFooterContent(prev => ({
                        ...prev,
                        newsletter: { ...prev?.newsletter, isEnabled: e.target.checked },
                      }))}
                    />
                    <span>Enable Newsletter Section</span>
                  </label>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Title</label>
                  <input
                    className="admin-form-input"
                    value={footerContent.newsletter?.title || ""}
                    onChange={(e) => setFooterContent(prev => ({
                      ...prev,
                      newsletter: { ...prev?.newsletter, title: e.target.value },
                    }))}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Subtitle</label>
                  <input
                    className="admin-form-input"
                    value={footerContent.newsletter?.subtitle || ""}
                    onChange={(e) => setFooterContent(prev => ({
                      ...prev,
                      newsletter: { ...prev?.newsletter, subtitle: e.target.value },
                    }))}
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleSaveFooter}
                disabled={saving}
                style={{ marginTop: 8 }}
              >
                {saving ? "Saving..." : "Save Footer Content"}
              </button>
            </div>
          )}

          {/* ============ OTHER TABS (Banners, FAQs, etc.) ============ */}
          {!["homepage", "footer"].includes(activeTab) && (
            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">
                  {tabs.find((t) => t.id === activeTab)?.label}
                </h3>
                <button className="admin-btn admin-btn-primary" onClick={handleCreate}>
                  + Add New
                </button>
              </div>

              {data.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-icon">📝</div>
                  <div className="admin-empty-title">No items yet</div>
                </div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        {activeTab === "banners" && (
                          <>
                            <th>Title</th>
                            <th>Position</th>
                            <th>Active</th>
                            <th>Actions</th>
                          </>
                        )}
                        {activeTab === "faqs" && (
                          <>
                            <th>Question</th>
                            <th>Category</th>
                            <th>Active</th>
                            <th>Actions</th>
                          </>
                        )}
                        {activeTab === "categories" && (
                          <>
                            <th>Name</th>
                            <th>Slug</th>
                            <th>Active</th>
                            <th>Actions</th>
                          </>
                        )}
                        {activeTab === "promo-codes" && (
                          <>
                            <th>Code</th>
                            <th>Discount</th>
                            <th>Valid Until</th>
                            <th>Active</th>
                            <th>Actions</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item) => (
                        <tr key={item._id}>
                          {activeTab === "banners" && (
                            <>
                              <td style={{ fontWeight: 500 }}>{item.title}</td>
                              <td>{item.position}</td>
                              <td>{item.isActive ? "✅" : "❌"}</td>
                            </>
                          )}
                          {activeTab === "faqs" && (
                            <>
                              <td style={{ fontWeight: 500 }}>{item.question}</td>
                              <td>{item.category}</td>
                              <td>{item.isActive ? "✅" : "❌"}</td>
                            </>
                          )}
                          {activeTab === "categories" && (
                            <>
                              <td style={{ fontWeight: 500 }}>{item.name}</td>
                              <td>{item.slug}</td>
                              <td>{item.isActive ? "✅" : "❌"}</td>
                            </>
                          )}
                          {activeTab === "promo-codes" && (
                            <>
                              <td style={{ fontWeight: 500 }}>{item.code}</td>
                              <td>
                                {item.discountValue}
                                {item.discountType === "percentage" ? "%" : "$"}
                              </td>
                              <td>{new Date(item.endDate).toLocaleDateString()}</td>
                              <td>{item.isActive ? "✅" : "❌"}</td>
                            </>
                          )}
                          <td>
                            <div className="admin-actions">
                              <button
                                className="admin-btn admin-btn-outline admin-btn-sm"
                                onClick={() => handleEdit(item)}
                              >
                                Edit
                              </button>
                              <button
                                className="admin-btn admin-btn-danger admin-btn-sm"
                                onClick={() => handleDelete(item._id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal for Banners, FAQs, Categories, Promo Codes */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editItem ? "Edit" : "Create"} {activeTab.slice(0, -1)}
              </h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              {activeTab === "banners" && (
                <>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Title</label>
                    <input
                      className="admin-form-input"
                      value={formData.title || ""}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Subtitle</label>
                    <input
                      className="admin-form-input"
                      value={formData.subtitle || ""}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <ImageUpload
                      label="Banner Image"
                      value={formData.imageUrl || ""}
                      onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Position</label>
                    <select
                      className="admin-form-select"
                      value={formData.position || "hero"}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    >
                      <option value="hero">Hero</option>
                      <option value="promo">Promo</option>
                      <option value="sidebar">Sidebar</option>
                    </select>
                  </div>
                </>
              )}
              {activeTab === "faqs" && (
                <>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Question</label>
                    <input
                      className="admin-form-input"
                      value={formData.question || ""}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Answer</label>
                    <textarea
                      className="admin-form-textarea"
                      value={formData.answer || ""}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Category</label>
                    <select
                      className="admin-form-select"
                      value={formData.category || "general"}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="general">General</option>
                      <option value="booking">Booking</option>
                      <option value="payment">Payment</option>
                      <option value="owner">Owner</option>
                      <option value="technical">Technical</option>
                    </select>
                  </div>
                </>
              )}
              {activeTab === "categories" && (
                <>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Name</label>
                    <input
                      className="admin-form-input"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Slug</label>
                    <input
                      className="admin-form-input"
                      value={formData.slug || ""}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Icon (emoji)</label>
                    <input
                      className="admin-form-input"
                      value={formData.icon || ""}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    />
                  </div>
                </>
              )}
              {activeTab === "promo-codes" && (
                <>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Code</label>
                    <input
                      className="admin-form-input"
                      value={formData.code || ""}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Discount Type</label>
                    <select
                      className="admin-form-select"
                      value={formData.discountType || "percentage"}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Discount Value</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      value={formData.discountValue || 0}
                      onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">End Date</label>
                    <input
                      type="date"
                      className="admin-form-input"
                      value={formData.endDate?.split("T")[0] || ""}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div className="admin-form-group">
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span className="admin-form-label" style={{ marginBottom: 0 }}>Active</span>
                </label>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="admin-btn admin-btn-primary" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCMS;
