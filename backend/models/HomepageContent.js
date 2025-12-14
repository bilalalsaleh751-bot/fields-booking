import mongoose from "mongoose";

const HomepageContentSchema = new mongoose.Schema(
  {
    contentId: { type: String, default: "main", unique: true },
    
    // Hero Section
    hero: {
      title: { type: String, default: "Book Sports Courts Across Lebanon" },
      subtitle: { type: String, default: "Football, padel, basketball, tennis and more – all in one place." },
      backgroundImage: { type: String, default: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1920&q=80" },
      ctaText: { type: String, default: "Find Courts" },
      ctaLink: { type: String, default: "/discover" },
    },
    
    // How It Works Section
    howItWorks: {
      title: { type: String, default: "How It Works" },
      subtitle: { type: String, default: "Book your favorite sports court in 3 easy steps" },
      steps: [{
        icon: String,
        title: String,
        description: String,
      }],
    },
    
    // Why Choose Us Section
    whyChooseUs: {
      title: { type: String, default: "Why Choose Sport Lebanon?" },
      subtitle: { type: String, default: "The premier platform for sports court bookings" },
      features: [{
        icon: String,
        title: String,
        description: String,
      }],
    },
    
    // Stats Section
    stats: {
      isEnabled: { type: Boolean, default: true },
      items: [{
        value: String,
        label: String,
      }],
    },
    
    // CTA Banner Section
    ctaBanner: {
      isEnabled: { type: Boolean, default: true },
      title: { type: String, default: "Ready to Play?" },
      subtitle: { type: String, default: "Join thousands of athletes booking courts every day" },
      buttonText: { type: String, default: "Get Started" },
      buttonLink: { type: String, default: "/discover" },
      backgroundImage: String,
    },
    
    // Cities Section
    cities: {
      title: { type: String, default: "Top Cities" },
      subtitle: { type: String, default: "Find courts in your favorite Lebanese cities" },
      items: [{
        name: String,
        courts: Number,
        imageUrl: String,
      }],
    },
    
    // SEO
    seo: {
      metaTitle: String,
      metaDescription: String,
    },
  },
  { timestamps: true }
);

// Static method to get or create homepage content
HomepageContentSchema.statics.getContent = async function() {
  let content = await this.findOne({ contentId: "main" });
  if (!content) {
    content = await this.create({
      contentId: "main",
      howItWorks: {
        title: "How It Works",
        subtitle: "Book your favorite sports court in 3 easy steps",
        steps: [
          { icon: "🔍", title: "Search", description: "Find courts by sport, location, and availability" },
          { icon: "📅", title: "Book", description: "Select your time slot and confirm your booking" },
          { icon: "⚽", title: "Play", description: "Show up and enjoy your game!" },
        ],
      },
      whyChooseUs: {
        title: "Why Choose Sport Lebanon?",
        subtitle: "The premier platform for sports court bookings",
        features: [
          { icon: "✓", title: "Verified Courts", description: "All courts are verified for quality and availability" },
          { icon: "⚡", title: "Instant Booking", description: "Book in seconds with real-time availability" },
          { icon: "💰", title: "Best Prices", description: "Competitive prices with no hidden fees" },
          { icon: "📱", title: "Easy to Use", description: "Simple booking process on any device" },
        ],
      },
      stats: {
        isEnabled: true,
        items: [
          { value: "500+", label: "Sports Courts" },
          { value: "50K+", label: "Happy Players" },
          { value: "100K+", label: "Bookings Made" },
          { value: "15+", label: "Cities Covered" },
        ],
      },
      cities: {
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
      },
    });
  }
  return content;
};

const HomepageContent = mongoose.model("HomepageContent", HomepageContentSchema);
export default HomepageContent;

