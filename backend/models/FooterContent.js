import mongoose from "mongoose";

const FooterContentSchema = new mongoose.Schema(
  {
    contentId: { type: String, default: "main", unique: true },
    
    // About Section
    about: {
      title: { type: String, default: "Sport Lebanon" },
      description: { type: String, default: "The premier platform for booking sports courts across Lebanon. Find and book football pitches, basketball courts, tennis courts, padel courts, and more." },
      logoUrl: String,
    },
    
    // Quick Links
    quickLinks: [{
      label: String,
      url: String,
      isExternal: { type: Boolean, default: false },
    }],
    
    // Support Links
    supportLinks: [{
      label: String,
      url: String,
      isExternal: { type: Boolean, default: false },
    }],
    
    // Social Links
    socialLinks: [{
      platform: { type: String, enum: ["facebook", "instagram", "twitter", "linkedin", "youtube", "tiktok"] },
      url: String,
      isActive: { type: Boolean, default: true },
    }],
    
    // Contact Info
    contact: {
      email: { type: String, default: "support@sportlebanon.com" },
      phone: String,
      address: String,
    },
    
    // Legal
    legal: {
      copyrightText: { type: String, default: "© {year} Sport Lebanon. All rights reserved." },
      termsUrl: { type: String, default: "/terms" },
      privacyUrl: { type: String, default: "/privacy" },
    },
    
    // Newsletter
    newsletter: {
      isEnabled: { type: Boolean, default: true },
      title: { type: String, default: "Stay Updated" },
      subtitle: { type: String, default: "Subscribe to get the latest news and offers" },
      buttonText: { type: String, default: "Subscribe" },
    },
  },
  { timestamps: true }
);

// Static method to get or create footer content
FooterContentSchema.statics.getContent = async function() {
  let content = await this.findOne({ contentId: "main" });
  if (!content) {
    content = await this.create({
      contentId: "main",
      quickLinks: [
        { label: "Home", url: "/", isExternal: false },
        { label: "Discover Courts", url: "/discover", isExternal: false },
        { label: "How It Works", url: "/#how-it-works", isExternal: false },
        { label: "For Field Owners", url: "/owner/register", isExternal: false },
      ],
      supportLinks: [
        { label: "FAQ", url: "/faq", isExternal: false },
        { label: "Contact Us", url: "/contact", isExternal: false },
        { label: "Help Center", url: "/help", isExternal: false },
      ],
      socialLinks: [
        { platform: "facebook", url: "https://facebook.com/sportlebanon", isActive: true },
        { platform: "instagram", url: "https://instagram.com/sportlebanon", isActive: true },
        { platform: "twitter", url: "https://twitter.com/sportlebanon", isActive: true },
      ],
    });
  }
  return content;
};

const FooterContent = mongoose.model("FooterContent", FooterContentSchema);
export default FooterContent;

