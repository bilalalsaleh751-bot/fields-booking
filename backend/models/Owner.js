import mongoose from "mongoose";

const OwnerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },

    // Business details
    businessName: String,
    address: String,
    city: String,
    area: String,
    businessDescription: String,
    sportsType: String,
    commercialRecord: String,

    // Documents
    idCardUrl: String,
    businessProofUrl: String,

    // Verification status (PDR 3.3)
    status: {
      type: String,
      enum: ["incomplete", "pending", "pending_review", "approved", "rejected", "suspended"],
      default: "incomplete",
    },

    rejectReason: String,

    // ===============================
    // NOTIFICATION PREFERENCES (PDR Settings)
    // ===============================
    notifications: {
      bookingCompleted: { type: Boolean, default: true },
      bookingCancelled: { type: Boolean, default: true },
      newReview: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const Owner = mongoose.model("Owner", OwnerSchema);
export default Owner;
