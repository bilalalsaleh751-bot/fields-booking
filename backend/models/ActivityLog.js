import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    
    action: {
      type: String,
      required: true,
      // Examples: "approve_owner", "reject_owner", "suspend_owner", "approve_field", 
      // "block_field", "update_booking", "update_commission", "send_broadcast"
    },
    
    entityType: {
      type: String,
      enum: ["owner", "field", "booking", "user", "settings", "cms", "notification"],
      required: true,
    },
    
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    
    before: {
      type: mongoose.Schema.Types.Mixed, // State before action
    },
    
    after: {
      type: mongoose.Schema.Types.Mixed, // State after action
    },
    
    description: String, // Human-readable description
    
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

// Indexes for efficient querying
ActivityLogSchema.index({ adminId: 1, createdAt: -1 });
ActivityLogSchema.index({ entityType: 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model("ActivityLog", ActivityLogSchema);
export default ActivityLog;

