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
    sportsType: String,
    commercialRecord: String,

    // Documents
    idCardUrl: String,
    businessProofUrl: String,

    // Verification status
    status: {
      type: String,
      enum: ["incomplete", "pending_review", "approved", "rejected"],
      default: "incomplete",
    },

    rejectReason: String,
  },
  { timestamps: true }
);

const Owner = mongoose.model("Owner", OwnerSchema);
export default Owner;
