import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/layout/Footer";
import "./FAQ.css";

export default function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/public/faqs");
        if (res.ok) {
          const data = await res.json();
          setFaqs(data.faqs || []);
        }
      } catch (err) {
        console.error("Failed to fetch FAQs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFAQs();
  }, []);

  // Get unique categories
  const categories = ["all", ...new Set(faqs.map(f => f.category))];

  // Filter FAQs by category
  const filteredFAQs = activeCategory === "all" 
    ? faqs 
    : faqs.filter(f => f.category === activeCategory);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const categoryLabels = {
    all: "All Questions",
    general: "General",
    booking: "Booking",
    payment: "Payment",
    owner: "For Owners",
    technical: "Technical",
  };

  return (
    <div className="faq-page">
      {/* Header */}
      <header className="faq-header">
        <div className="container">
          <Link to="/" className="back-link">← Back to Home</Link>
          <h1>Frequently Asked Questions</h1>
          <p>Find answers to common questions about our platform</p>
        </div>
      </header>

      {/* Categories */}
      <section className="faq-categories">
        <div className="container">
          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-tab ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="faq-content">
        <div className="container">
          {loading ? (
            <div className="faq-loading">Loading FAQs...</div>
          ) : filteredFAQs.length === 0 ? (
            <div className="faq-empty">
              <p>No FAQs found for this category.</p>
            </div>
          ) : (
            <div className="faq-list">
              {filteredFAQs.map((faq, index) => (
                <div 
                  key={faq._id || index} 
                  className={`faq-item ${openIndex === index ? "open" : ""}`}
                >
                  <button 
                    className="faq-question" 
                    onClick={() => toggleFAQ(index)}
                  >
                    <span>{faq.question}</span>
                    <span className="faq-icon">{openIndex === index ? "−" : "+"}</span>
                  </button>
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="faq-cta">
        <div className="container">
          <div className="cta-box">
            <h2>Still have questions?</h2>
            <p>Our support team is here to help you</p>
            <a href="mailto:support@sportlebanon.com" className="cta-button">
              Contact Support
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

