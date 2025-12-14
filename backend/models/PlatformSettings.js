import mongoose from "mongoose";

const PlatformSettingsSchema = new mongoose.Schema(
  {
    // Singleton identifier - always use "main"
    settingsId: {
      type: String,
      default: "main",
      unique: true,
    },
    
    // Commission rate (percentage)
    commissionRate: {
      type: Number,
      default: 15, // 15%
      min: 0,
      max: 100,
    },
    
    // Payment gateway settings (placeholder - no real gateway)
    paymentGateway: {
      provider: { type: String, default: "stripe" },
      publicKey: String,
      secretKey: String,
      webhookSecret: String,
      isEnabled: { type: Boolean, default: false },
      testMode: { type: Boolean, default: true },
    },
    
    // Platform info
    platformName: { type: String, default: "Sport Lebanon" },
    supportEmail: { type: String, default: "support@sportlebanon.com" },
    supportPhone: String,
    
    // Maintenance mode
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: String,
  },
  { timestamps: true }
);

// Ensure singleton - always get/update the same document
PlatformSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne({ settingsId: "main" });
  if (!settings) {
    settings = await this.create({ settingsId: "main" });
  }
  return settings;
};

const PlatformSettings = mongoose.model("PlatformSettings", PlatformSettingsSchema);
export default PlatformSettings;

