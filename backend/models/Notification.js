import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["completed", "cancelled", "review"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // Optional reference to related booking or field
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    relatedField: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Field",
    },
  },
  { timestamps: true }
);

// Index for fetching owner's notifications efficiently
NotificationSchema.index({ owner: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;

