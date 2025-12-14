import PlatformSettings from "../models/PlatformSettings.js";
import City from "../models/City.js";
import ActivityLog from "../models/ActivityLog.js";

// ============================================================
// PLATFORM SETTINGS
// ============================================================
export const getSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    res.json({ settings });
  } catch (err) {
    console.error("Get settings error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    const before = { ...settings.toObject() };
    
    // Update allowed fields
    const allowedFields = [
      "platformName", "supportEmail", "supportPhone",
      "maintenanceMode", "maintenanceMessage",
    ];
    
    allowedFields.forEach((key) => {
      if (req.body[key] !== undefined) {
        settings[key] = req.body[key];
      }
    });
    
    await settings.save();
    
    // Log activity
    await ActivityLog.create({
      adminId: req.admin._id,
      action: "update_settings",
      entityType: "settings",
      entityId: settings._id,
      before,
      after: { ...settings.toObject() },
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({ message: "Settings updated", settings });
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// PAYMENT GATEWAY SETTINGS (SUPER_ADMIN ONLY)
// ============================================================
export const getGatewaySettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    
    // Mask sensitive data
    const gateway = { ...settings.paymentGateway.toObject() };
    if (gateway.secretKey) {
      gateway.secretKey = "••••••••" + gateway.secretKey.slice(-4);
    }
    if (gateway.webhookSecret) {
      gateway.webhookSecret = "••••••••" + gateway.webhookSecret.slice(-4);
    }
    
    res.json({ gateway });
  } catch (err) {
    console.error("Get gateway settings error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateGatewaySettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    const before = { paymentGateway: { ...settings.paymentGateway.toObject() } };
    
    // Update gateway settings
    if (req.body.provider) settings.paymentGateway.provider = req.body.provider;
    if (req.body.publicKey) settings.paymentGateway.publicKey = req.body.publicKey;
    if (req.body.secretKey) settings.paymentGateway.secretKey = req.body.secretKey;
    if (req.body.webhookSecret) settings.paymentGateway.webhookSecret = req.body.webhookSecret;
    if (req.body.isEnabled !== undefined) settings.paymentGateway.isEnabled = req.body.isEnabled;
    if (req.body.testMode !== undefined) settings.paymentGateway.testMode = req.body.testMode;
    
    await settings.save();
    
    // Log activity (don't log actual secrets)
    await ActivityLog.create({
      adminId: req.admin._id,
      action: "update_gateway",
      entityType: "settings",
      entityId: settings._id,
      before: { provider: before.paymentGateway.provider },
      after: { provider: settings.paymentGateway.provider },
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({ message: "Gateway settings updated" });
  } catch (err) {
    console.error("Update gateway settings error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// CITIES / AREAS
// ============================================================
export const getCities = async (req, res) => {
  try {
    const cities = await City.find().sort({ sortOrder: 1, name: 1 });
    res.json({ cities });
  } catch (err) {
    console.error("Get cities error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createCity = async (req, res) => {
  try {
    const city = await City.create(req.body);
    res.status(201).json({ message: "City created", city });
  } catch (err) {
    console.error("Create city error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "City already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCity = async (req, res) => {
  try {
    const city = await City.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!city) {
      return res.status(404).json({ message: "City not found" });
    }
    res.json({ message: "City updated", city });
  } catch (err) {
    console.error("Update city error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteCity = async (req, res) => {
  try {
    const city = await City.findByIdAndDelete(req.params.id);
    if (!city) {
      return res.status(404).json({ message: "City not found" });
    }
    res.json({ message: "City deleted" });
  } catch (err) {
    console.error("Delete city error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// AREAS (within a city)
// ============================================================
export const addArea = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "Area name is required" });
    }
    
    const city = await City.findById(req.params.cityId);
    if (!city) {
      return res.status(404).json({ message: "City not found" });
    }
    
    city.areas.push({ name, isActive: true });
    await city.save();
    
    res.json({ message: "Area added", city });
  } catch (err) {
    console.error("Add area error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const removeArea = async (req, res) => {
  try {
    const { cityId, areaId } = req.params;
    
    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({ message: "City not found" });
    }
    
    city.areas = city.areas.filter((a) => a._id.toString() !== areaId);
    await city.save();
    
    res.json({ message: "Area removed", city });
  } catch (err) {
    console.error("Remove area error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

