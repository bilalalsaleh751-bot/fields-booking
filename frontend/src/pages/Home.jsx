import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Home.css";
import Footer from "../components/layout/Footer";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // Search form state
  const [sport, setSport] = useState("Football");
  const [city, setCity] = useState("Beirut");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("08:00");

  // Fetch homepage data
  useEffect(() => {
    const fetchHomepage = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/public/homepage");
        if (res.ok) {
          const data = await res.json();
          setContent(data.content);
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Failed to fetch homepage:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomepage();
  }, []);

  // Handle search
  const handleSearch = () => {
    if (!date) {
      alert("Please select a date.");
      return;
    }
    navigate(`/discover?sport=${sport}&city=${city}&date=${date}&time=${time}`);
  };

  // Default content if CMS not loaded
  const hero = content?.hero || {
    title: "Book Sports Courts Across Lebanon",
    subtitle: "Football, padel, basketball, tennis and more – all in one place.",
    backgroundImage: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1920&q=80",
    ctaText: "Find Courts",
  };

  const howItWorks = content?.howItWorks || {
    title: "How It Works",
    subtitle: "Book your favorite sports court in 3 easy steps",
    steps: [
      { icon: "🔍", title: "Search", description: "Find courts by sport, location, and availability" },
      { icon: "📅", title: "Book", description: "Select your time slot and confirm instantly" },
      { icon: "⚽", title: "Play", description: "Show up and enjoy your game!" },
    ],
  };

  const whyChooseUs = content?.whyChooseUs || {
    title: "Why Choose Sport Lebanon?",
    subtitle: "The premier platform for sports court bookings",
    features: [
      { icon: "✓", title: "Verified Courts", description: "All courts are verified for quality and availability" },
      { icon: "⚡", title: "Instant Booking", description: "Book in seconds with real-time availability" },
      { icon: "💰", title: "Best Prices", description: "Competitive prices with no hidden fees" },
      { icon: "📱", title: "Easy to Use", description: "Simple booking process on any device" },
    ],
  };

  const stats = content?.stats || {
    isEnabled: true,
    items: [
      { value: "500+", label: "Sports Courts" },
      { value: "50K+", label: "Happy Players" },
      { value: "100K+", label: "Bookings Made" },
      { value: "15+", label: "Cities Covered" },
    ],
  };

  const citiesSection = content?.cities || {
    title: "Top Cities",
    subtitle: "Find courts in your favorite Lebanese cities",
    items: [
      { name: "Beirut", courts: 150, imageUrl: "https://images.unsplash.com/photo-1579606032821-4e6161c81571?auto=format&fit=crop&w=800&q=60" },
      { name: "Tripoli", courts: 45, imageUrl: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=800&q=60" },
      { name: "Sidon", courts: 38, imageUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=60" },
      { name: "Jounieh", courts: 52, imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=60" },
      { name: "Byblos", courts: 28, imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=60" },
      { name: "Zahle", courts: 32, imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=60" },
    ],
  };

  const ctaBanner = content?.ctaBanner || {
    isEnabled: true,
    title: "Ready to Play?",
    subtitle: "Join thousands of athletes booking courts every day",
    buttonText: "Get Started",
    buttonLink: "/discover",
  };

  // Sport categories with icons
  const sportCategories = categories.length > 0 ? categories : [
    { name: "Football", icon: "⚽", slug: "football" },
    { name: "Basketball", icon: "🏀", slug: "basketball" },
    { name: "Tennis", icon: "🎾", slug: "tennis" },
    { name: "Padel", icon: "🏓", slug: "padel" },
    { name: "Volleyball", icon: "🏐", slug: "volleyball" },
    { name: "Swimming", icon: "🏊", slug: "swimming" },
  ];

  if (loading) {
    return (
      <div className="home-loading">
        <div className="home-loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* ===================== HERO SECTION ===================== */}
      <section className="hero" style={{ backgroundImage: `url(${hero.backgroundImage})` }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">{hero.title}</h1>
          <p className="hero-subtitle">{hero.subtitle}</p>

          {/* Search Box */}
          <div className="search-box">
            <div className="search-field">
              <label>Sport</label>
              <select value={sport} onChange={(e) => setSport(e.target.value)}>
                <option>Football</option>
                <option>Basketball</option>
                <option>Tennis</option>
                <option>Padel</option>
                <option>Volleyball</option>
                <option>Swimming</option>
              </select>
            </div>

            <div className="search-field">
              <label>City</label>
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                <option>Beirut</option>
                <option>Tripoli</option>
                <option>Sidon</option>
                <option>Jounieh</option>
                <option>Byblos</option>
                <option>Zahle</option>
              </select>
            </div>

            <div className="search-field">
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="search-field">
              <label>Time</label>
              <select value={time} onChange={(e) => setTime(e.target.value)}>
                {Array.from({ length: 15 }, (_, i) => i + 6).map((h) => (
                  <option key={h} value={`${String(h).padStart(2, "0")}:00`}>
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>

            <button className="search-btn" onClick={handleSearch}>
              {hero.ctaText || "Find Courts"}
            </button>
          </div>
        </div>
      </section>

      {/* ===================== SPORT CATEGORIES ===================== */}
      <section className="section categories-section">
        <div className="container">
          <h2 className="section-title">Popular Sports</h2>
          <p className="section-subtitle">Choose your favorite sport and find available courts</p>
          
          <div className="categories-grid">
            {sportCategories.map((cat, i) => (
              <Link 
                to={`/discover?sport=${cat.slug || cat.name}`} 
                key={i} 
                className="category-card"
              >
                <span className="category-icon">{cat.icon || "🏆"}</span>
                <span className="category-name">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="section how-it-works" id="how-it-works">
        <div className="container">
          <h2 className="section-title">{howItWorks.title}</h2>
          <p className="section-subtitle">{howItWorks.subtitle}</p>
          
          <div className="steps-grid">
            {howItWorks.steps?.map((step, i) => (
              <div key={i} className="step-card">
                <div className="step-number">{i + 1}</div>
                <span className="step-icon">{step.icon}</span>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== STATS ===================== */}
      {stats.isEnabled && (
        <section className="section stats-section">
          <div className="container">
            <div className="stats-grid">
              {stats.items?.map((stat, i) => (
                <div key={i} className="stat-card">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== WHY CHOOSE US ===================== */}
      <section className="section why-choose-section">
        <div className="container">
          <h2 className="section-title">{whyChooseUs.title}</h2>
          <p className="section-subtitle">{whyChooseUs.subtitle}</p>
          
          <div className="features-grid">
            {whyChooseUs.features?.map((feature, i) => (
              <div key={i} className="feature-card">
                <span className="feature-icon">{feature.icon}</span>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CITIES ===================== */}
      <section className="section cities-section">
        <div className="container">
          <h2 className="section-title">{citiesSection.title}</h2>
          <p className="section-subtitle">{citiesSection.subtitle}</p>
          
          <div className="cities-grid">
            {citiesSection.items?.map((c, i) => (
              <Link 
                to={`/discover?city=${c.name}`} 
                key={i} 
                className="city-card"
              >
                <img src={c.imageUrl} alt={c.name} loading="lazy" />
                <div className="city-overlay"></div>
                <div className="city-info">
                  <h3>{c.name}</h3>
                  <p>{c.courts} courts available</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA BANNER ===================== */}
      {ctaBanner.isEnabled && (
        <section className="section cta-section">
          <div className="container">
            <div className="cta-card">
              <div className="cta-content">
                <h2 className="cta-title">{ctaBanner.title}</h2>
                <p className="cta-subtitle">{ctaBanner.subtitle}</p>
              </div>
              <Link to={ctaBanner.buttonLink || "/discover"} className="cta-btn">
                {ctaBanner.buttonText}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===================== FOOTER ===================== */}
      <Footer />
    </div>
  );
}
