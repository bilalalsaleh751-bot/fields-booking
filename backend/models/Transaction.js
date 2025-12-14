import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true, // Ensures idempotency - one transaction per booking
    },
    
    fieldId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Field",
      required: true,
    },
    
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },
    
    // User info (stored directly since users may not have accounts)
    userName: String,
    userEmail: String,
    userPhone: String,
    
    // Financial
    amountGross: {
      type: Number,
      required: true,
      min: 0,
    },
    
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    
    netToOwner: {
      type: Number,
      required: true,
      min: 0,
    },
    
    status: {
      type: String,
      enum: ["pending", "completed", "refunded"],
      default: "completed",
    },
    
    // Booking details snapshot
    bookingDate: String,
    bookingStartTime: String,
    bookingEndTime: String,
    fieldName: String,
  },
  { timestamps: true }
);

// Indexes for efficient querying
TransactionSchema.index({ ownerId: 1, createdAt: -1 });
TransactionSchema.index({ fieldId: 1, createdAt: -1 });
TransactionSchema.index({ status: 1, createdAt: -1 });
TransactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.model("Transaction", TransactionSchema);
export default Transaction;

