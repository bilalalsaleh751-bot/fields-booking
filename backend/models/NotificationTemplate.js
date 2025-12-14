import mongoose from "mongoose";

const NotificationTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    
    // Template type
    type: {
      type: String,
      enum: ["email", "sms", "push", "in_app"],
      default: "in_app",
    },
    
    // Event trigger
    trigger: {
      type: String,
      enum: [
        "booking_created",
        "booking_confirmed",
        "booking_completed",
        "booking_cancelled",
        "owner_approved",
        "owner_rejected",
        "field_approved",
        "field_blocked",
        "new_review",
        "broadcast",
        "custom",
      ],
      required: true,
    },
    
    subject: String, // For emails
    
    // Template with variables like {{userName}}, {{fieldName}}, etc.
    body: { type: String, required: true },
    
    // Available variables for this template
    variables: [String],
    
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const NotificationTemplate = mongoose.model("NotificationTemplate", NotificationTemplateSchema);
export default NotificationTemplate;

