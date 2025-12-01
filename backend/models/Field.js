// backend/models/Field.js
import mongoose from "mongoose";

// Subdocument for reviews
const reviewSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const fieldSchema = new mongoose.Schema(
  {
    // BASIC INFO
    name: { type: String, required: true },
    sport: { type: String, required: true }, // Football, Padel...
    city: { type: String, required: true },  // Beirut, Sidon...
    area: { type: String },                  // Optional neighborhood
    address: { type: String },

    // DESCRIPTION & MEDIA
    description: { type: String },
    mainImage: { type: String },             // Hero image
    images: [{ type: String }],              // Gallery images

    // PRICING
    pricePerHour: { type: Number, required: true },
    currency: { type: String, default: "USD" },

    // FIELD ATTRIBUTES
    isIndoor: { type: Boolean, default: false },
    surfaceType: { type: String },           // Turf, Grass, Hardwood...
    maxPlayers: { type: Number },

    // AMENITIES & RULES
    amenities: [{ type: String }],
    rules: [{ type: String }],

    // OPENING HOURS
    openingHours: {
      open: { type: String, default: "08:00" },
      close: { type: String, default: "23:00" },
    },

    // OWNER INFO
    owner: {
      name: { type: String },
      phone: { type: String },
      email: { type: String },
    },

    // LOCATION (Google Maps)
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },

    // REVIEWS SUMMARY
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },

    // REVIEWS LIST
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

// ✅ Default export ONLY
const Field = mongoose.model("Field", fieldSchema);
export default Field;
