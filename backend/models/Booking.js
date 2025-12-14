import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    field: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Field",
      required: true,
      index: true, // Index for field queries
    },
    
    // Optional user reference for logged-in customers
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userPhone: { type: String, required: true },
    
    // Review (added by customer after booking is completed)
    review: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      createdAt: Date,
    },

    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true, // Index for date queries
    },

    // ============================================================
    // TIME RANGE MODEL (FINALIZED)
    // Bookings are stored as explicit time ranges for clarity
    // startTime: When booking begins (inclusive)
    // endTime: When booking ends (exclusive)
    // duration: For display/reference only
    // ============================================================
    startTime: {
      type: String, // "HH:00" format (normalized to hour)
      required: true,
    },

    endTime: {
      type: String, // "HH:00" format - calculated from startTime + duration
      required: true,
    },

    duration: {
      type: Number, // hours (can be fractional: 1, 1.5, 2, etc.)
      required: true,
      min: 0.5,
      max: 12,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "disputed"],
      default: "pending",
      index: true, // Index for status filtering
    },
    
    // Payment status (PDR 3.5)
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    
    // Dispute handling
    disputeReason: String,
    disputeResolvedAt: Date,
    disputeResolution: String,
  },
  { timestamps: true }
);

// ============================================================
// COMPOUND INDEX for efficient overlap queries
// Used by availability checks and race condition prevention
// ============================================================
bookingSchema.index({ field: 1, date: 1, status: 1 });

// ============================================================
// COMPOUND INDEX to prevent exact duplicate bookings
// This provides database-level protection against race conditions
// ============================================================
bookingSchema.index(
  { field: 1, date: 1, startTime: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: { $ne: "cancelled" } }
  }
);

export default mongoose.model("Booking", bookingSchema);
