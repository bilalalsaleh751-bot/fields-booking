// backend/models/Field.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    response: { type: String }, // Owner response (PDR 2.6)
    responseDate: { type: Date }, // When owner responded
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const fieldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sport: { type: String, required: false }, // Legacy field, kept for backward compatibility
    sportType: { type: String, required: false }, // PDR 2.3 Phase 1
    city: { type: String, required: false }, // Not required in Phase 1
    area: String,
    address: String,

    description: String,
    mainImage: String,
    images: [String],

    pricePerHour: { type: Number, required: true },
    currency: { type: String, default: "USD" },

    allowedDurations: { type: [Number], default: [1, 1.5, 2, 3] }, // PDR 2.3 - Allowed booking durations in hours

    isIndoor: { type: Boolean, default: false },
    surfaceType: String,
    maxPlayers: Number,

    amenities: [String],
    rules: [String],

    openingHours: {
      open: { type: String, default: "08:00" },
      close: { type: String, default: "23:00" },
    },

    // 🔥 FIX — owner must be ObjectId
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },

    location: {
      lat: Number,
      lng: Number,
    },

    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true }, // PDR 2.3 Phase 2

    // Availability blocking (PDR 2.3)
    blockedDates: [{ type: String }], // Array of YYYY-MM-DD dates that are blocked
    blockedTimeSlots: [{
      date: { type: String }, // YYYY-MM-DD
      timeSlots: [{ type: String }], // Array of "HH:MM" times
    }],

    reviews: [reviewSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Field", fieldSchema);
