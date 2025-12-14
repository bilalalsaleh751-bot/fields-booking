import mongoose from "mongoose";

const CMSBannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: String,
    
    imageUrl: { type: String, required: true },
    
    linkUrl: String, // Where banner clicks navigate to
    linkText: String, // Button text
    
    position: {
      type: String,
      enum: ["hero", "promo", "sidebar"],
      default: "hero",
    },
    
    isActive: { type: Boolean, default: true },
    
    // Scheduling
    startDate: Date,
    endDate: Date,
    
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CMSBannerSchema.index({ isActive: 1, position: 1, sortOrder: 1 });

const CMSBanner = mongoose.model("CMSBanner", CMSBannerSchema);
export default CMSBanner;

