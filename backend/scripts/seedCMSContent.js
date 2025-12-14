// Seed script for CMS content
// Run: node scripts/seedCMSContent.js

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Import models
import HomepageContent from "../models/HomepageContent.js";
import FooterContent from "../models/FooterContent.js";
import Category from "../models/Category.js";
import FAQ from "../models/FAQ.js";

const seedCMSContent = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // ========== HOMEPAGE CONTENT ==========
    const existingHomepage = await HomepageContent.findOne({ contentId: "main" });
    if (!existingHomepage) {
      await HomepageContent.create({
        contentId: "main",
        hero: {
          title: "Book Sports Courts Across Lebanon",
          subtitle: "Football, padel, basketball, tennis and more – all in one place.",
          backgroundImage: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1920&q=80",
          ctaText: "Find Courts",
          ctaLink: "/discover",
        },
        howItWorks: {
          title: "How It Works",
          subtitle: "Book your favorite sports court in 3 easy steps",
          steps: [
            { icon: "🔍", title: "Search", description: "Find courts by sport, location, and availability" },
            { icon: "📅", title: "Book", description: "Select your time slot and confirm instantly" },
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
        ctaBanner: {
          isEnabled: true,
          title: "Ready to Play?",
          subtitle: "Join thousands of athletes booking courts every day",
          buttonText: "Get Started",
          buttonLink: "/discover",
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
      console.log("✅ Homepage content created");
    } else {
      console.log("ℹ️ Homepage content already exists");
    }

    // ========== FOOTER CONTENT ==========
    const existingFooter = await FooterContent.findOne({ contentId: "main" });
    if (!existingFooter) {
      await FooterContent.create({
        contentId: "main",
        about: {
          title: "Sport Lebanon",
          description: "The premier platform for booking sports courts across Lebanon. Find and book football pitches, basketball courts, tennis courts, padel courts, and more.",
        },
        quickLinks: [
          { label: "Home", url: "/", isExternal: false },
          { label: "Discover Courts", url: "/discover", isExternal: false },
          { label: "How It Works", url: "/#how-it-works", isExternal: false },
          { label: "For Field Owners", url: "/owner/register", isExternal: false },
        ],
        supportLinks: [
          { label: "FAQ", url: "/faq", isExternal: false },
          { label: "Contact Us", url: "mailto:support@sportlebanon.com", isExternal: true },
          { label: "Help Center", url: "/help", isExternal: false },
        ],
        socialLinks: [
          { platform: "facebook", url: "https://facebook.com/sportlebanon", isActive: true },
          { platform: "instagram", url: "https://instagram.com/sportlebanon", isActive: true },
          { platform: "twitter", url: "https://twitter.com/sportlebanon", isActive: true },
        ],
        contact: {
          email: "support@sportlebanon.com",
          phone: "+961 1 234 567",
          address: "Beirut, Lebanon",
        },
        legal: {
          copyrightText: "© {year} Sport Lebanon. All rights reserved.",
          termsUrl: "/terms",
          privacyUrl: "/privacy",
        },
        newsletter: {
          isEnabled: true,
          title: "Stay Updated",
          subtitle: "Subscribe to get the latest news and offers",
          buttonText: "Subscribe",
        },
      });
      console.log("✅ Footer content created");
    } else {
      console.log("ℹ️ Footer content already exists");
    }

    // ========== CATEGORIES ==========
    const existingCategories = await Category.countDocuments();
    if (existingCategories === 0) {
      await Category.insertMany([
        { name: "Football", slug: "football", icon: "⚽", description: "Book football pitches and 5-a-side courts", isActive: true, sortOrder: 1 },
        { name: "Basketball", slug: "basketball", icon: "🏀", description: "Indoor and outdoor basketball courts", isActive: true, sortOrder: 2 },
        { name: "Tennis", slug: "tennis", icon: "🎾", description: "Clay, grass, and hard court tennis", isActive: true, sortOrder: 3 },
        { name: "Padel", slug: "padel", icon: "🏓", description: "Modern padel courts across Lebanon", isActive: true, sortOrder: 4 },
        { name: "Volleyball", slug: "volleyball", icon: "🏐", description: "Beach and indoor volleyball", isActive: true, sortOrder: 5 },
        { name: "Swimming", slug: "swimming", icon: "🏊", description: "Pool lanes and aquatic facilities", isActive: true, sortOrder: 6 },
      ]);
      console.log("✅ Categories created");
    } else {
      console.log("ℹ️ Categories already exist");
    }

    // ========== FAQs ==========
    const existingFAQs = await FAQ.countDocuments();
    if (existingFAQs === 0) {
      await FAQ.insertMany([
        // General
        { question: "What is Sport Lebanon?", answer: "Sport Lebanon is the premier platform for booking sports courts across Lebanon. We connect athletes with verified sports facilities, making it easy to find and book football pitches, basketball courts, tennis courts, padel courts, and more.", category: "general", isActive: true, sortOrder: 1 },
        { question: "Which cities do you cover?", answer: "We currently operate in major Lebanese cities including Beirut, Tripoli, Sidon, Jounieh, Byblos, and Zahle. We are continuously expanding to more areas.", category: "general", isActive: true, sortOrder: 2 },
        { question: "Is the platform free to use?", answer: "Yes! Creating an account and browsing available courts is completely free. You only pay when you make a booking.", category: "general", isActive: true, sortOrder: 3 },
        // Booking
        { question: "How do I book a court?", answer: "Simply search for courts by sport, location, and date. Select your preferred time slot, review the details, and confirm your booking. You'll receive instant confirmation.", category: "booking", isActive: true, sortOrder: 1 },
        { question: "Can I cancel my booking?", answer: "Yes, you can cancel your booking up to 24 hours before the scheduled time for a full refund. Cancellations within 24 hours may be subject to a cancellation fee.", category: "booking", isActive: true, sortOrder: 2 },
        { question: "What if the court is not as described?", answer: "We verify all our partner courts. If you encounter any issues, please contact our support team immediately and we'll help resolve the situation, including providing a refund if necessary.", category: "booking", isActive: true, sortOrder: 3 },
        // Payment
        { question: "What payment methods do you accept?", answer: "We accept major credit and debit cards, as well as mobile payment solutions. Cash payment may be available at select venues.", category: "payment", isActive: true, sortOrder: 1 },
        { question: "Is my payment information secure?", answer: "Absolutely. We use industry-standard encryption and never store your full payment details on our servers.", category: "payment", isActive: true, sortOrder: 2 },
        { question: "How do refunds work?", answer: "Refunds are processed within 5-7 business days and returned to your original payment method.", category: "payment", isActive: true, sortOrder: 3 },
        // Owner
        { question: "How can I list my sports facility?", answer: "Click on 'For Field Owners' to register your facility. You'll need to provide basic information, business documents, and photos. Our team will review your application within 48 hours.", category: "owner", isActive: true, sortOrder: 1 },
        { question: "What are the fees for facility owners?", answer: "We charge a small commission on each booking. There are no upfront costs or monthly fees. You only pay when you earn.", category: "owner", isActive: true, sortOrder: 2 },
        { question: "How do I manage my bookings?", answer: "Once approved, you'll have access to a comprehensive dashboard where you can manage bookings, set availability, view financial reports, and communicate with customers.", category: "owner", isActive: true, sortOrder: 3 },
      ]);
      console.log("✅ FAQs created");
    } else {
      console.log("ℹ️ FAQs already exist");
    }

    console.log("\n🎉 CMS content seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

seedCMSContent();

