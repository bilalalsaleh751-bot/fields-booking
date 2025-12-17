import mongoose from "mongoose";

const DiscoverContentSchema = new mongoose.Schema(
  {
    contentId: { type: String, default: "main", unique: true },
    
    // Header Section
    header: {
      title: { type: String, default: "Discover Sports Courts" },
      subtitle: { type: String, default: "Find and book the perfect court for your game" },
      backgroundImage: { type: String, default: "" },
      showSearch: { type: Boolean, default: true },
    },
    
    // Banner Section (optional promotional banner)
    banner: {
      isEnabled: { type: Boolean, default: false },
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      buttonText: { type: String, default: "Learn More" },
      buttonLink: { type: String, default: "" },
      backgroundImage: { type: String, default: "" },
      backgroundColor: { type: String, default: "#3b82f6" },
    },
    
    // Featured Section
    featured: {
      isEnabled: { type: Boolean, default: true },
      title: { type: String, default: "Featured Courts" },
      subtitle: { type: String, default: "Top-rated courts recommended for you" },
    },
    
    // Categories Section
    categories: {
      isEnabled: { type: Boolean, default: true },
      title: { type: String, default: "Browse by Sport" },
      subtitle: { type: String, default: "Find courts for your favorite sport" },
    },
    
    // Filter Labels (can be customized)
    filterLabels: {
      sport: { type: String, default: "Sport" },
      city: { type: String, default: "City" },
      area: { type: String, default: "Area" },
      date: { type: String, default: "Date" },
      time: { type: String, default: "Time" },
      priceRange: { type: String, default: "Price Range" },
      rating: { type: String, default: "Min Rating" },
      indoor: { type: String, default: "Type" },
      surface: { type: String, default: "Surface" },
      amenities: { type: String, default: "Amenities" },
    },
    
    // No Results Message
    noResults: {
      title: { type: String, default: "No Courts Found" },
      message: { type: String, default: "Try adjusting your filters or search in a different area" },
      showContactLink: { type: Boolean, default: true },
    },
    
    // Call-to-Action Section
    ctaSection: {
      isEnabled: { type: Boolean, default: true },
      title: { type: String, default: "Can't find what you're looking for?" },
      description: { type: String, default: "Contact us and we'll help you find the perfect court" },
      buttonText: { type: String, default: "Contact Us" },
      buttonLink: { type: String, default: "/contact" },
    },
    
    // SEO
    seo: {
      metaTitle: { type: String, default: "Discover Sports Courts | Sport Lebanon" },
      metaDescription: { type: String, default: "Find and book sports courts across Lebanon. Football, basketball, tennis, padel and more." },
    },
  },
  { timestamps: true }
);

// Static method to get or create discover content
DiscoverContentSchema.statics.getContent = async function() {
  let content = await this.findOne({ contentId: "main" });
  if (!content) {
    content = await this.create({
      contentId: "main",
      header: {
        title: "Discover Sports Courts",
        subtitle: "Find and book the perfect court for your game",
        backgroundImage: "",
        showSearch: true,
      },
      banner: {
        isEnabled: false,
        title: "",
        description: "",
        buttonText: "Learn More",
        buttonLink: "",
        backgroundImage: "",
        backgroundColor: "#3b82f6",
      },
      featured: {
        isEnabled: true,
        title: "Featured Courts",
        subtitle: "Top-rated courts recommended for you",
      },
      categories: {
        isEnabled: true,
        title: "Browse by Sport",
        subtitle: "Find courts for your favorite sport",
      },
      filterLabels: {
        sport: "Sport",
        city: "City",
        area: "Area",
        date: "Date",
        time: "Time",
        priceRange: "Price Range",
        rating: "Min Rating",
        indoor: "Type",
        surface: "Surface",
        amenities: "Amenities",
      },
      noResults: {
        title: "No Courts Found",
        message: "Try adjusting your filters or search in a different area",
        showContactLink: true,
      },
      ctaSection: {
        isEnabled: true,
        title: "Can't find what you're looking for?",
        description: "Contact us and we'll help you find the perfect court",
        buttonText: "Contact Us",
        buttonLink: "/contact",
      },
    });
  }
  return content;
};

const DiscoverContent = mongoose.model("DiscoverContent", DiscoverContentSchema);
export default DiscoverContent;

