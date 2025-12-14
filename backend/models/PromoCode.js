import mongoose from "mongoose";

const PromoCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    
    description: String,
    
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Usage limits
    maxUses: { type: Number, default: null }, // null = unlimited
    usedCount: { type: Number, default: 0 },
    maxUsesPerUser: { type: Number, default: 1 },
    
    // Validity
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    
    // Restrictions
    minBookingAmount: { type: Number, default: 0 },
    maxDiscountAmount: Number, // Cap for percentage discounts
    
    // Targeting
    applicableFields: [{ type: mongoose.Schema.Types.ObjectId, ref: "Field" }], // Empty = all fields
    applicableSports: [String], // Empty = all sports
    
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PromoCodeSchema.index({ code: 1, isActive: 1 });
PromoCodeSchema.index({ startDate: 1, endDate: 1, isActive: 1 });

const PromoCode = mongoose.model("PromoCode", PromoCodeSchema);
export default PromoCode;

