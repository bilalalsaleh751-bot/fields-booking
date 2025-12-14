import NotificationTemplate from "../models/NotificationTemplate.js";
import Notification from "../models/Notification.js";
import Owner from "../models/Owner.js";
import ActivityLog from "../models/ActivityLog.js";

// ============================================================
// TEMPLATES
// ============================================================
export const getTemplates = async (req, res) => {
  try {
    const templates = await NotificationTemplate.find().sort({ trigger: 1, name: 1 });
    res.json({ templates });
  } catch (err) {
    console.error("Get templates error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const template = await NotificationTemplate.create(req.body);
    res.status(201).json({ message: "Template created", template });
  } catch (err) {
    console.error("Create template error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Template name already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const template = await NotificationTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.json({ message: "Template updated", template });
  } catch (err) {
    console.error("Update template error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const template = await NotificationTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.json({ message: "Template deleted" });
  } catch (err) {
    console.error("Delete template error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// BROADCAST
// ============================================================
export const sendBroadcast = async (req, res) => {
  try {
    const { title, message, targetType, templateId } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }
    
    let messageBody = message;
    
    // If template is provided, use it
    if (templateId) {
      const template = await NotificationTemplate.findById(templateId);
      if (template) {
        messageBody = template.body;
      }
    }
    
    // Get target users
    let owners = [];
    if (targetType === "all" || targetType === "owners" || !targetType) {
      owners = await Owner.find({ status: "approved" }).select("_id");
    }
    
    // Create notifications in batch
    const notifications = owners.map((owner) => ({
      ownerId: owner._id,
      type: "broadcast",
      message: `${title}: ${messageBody}`,
      isRead: false,
    }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
    
    // Log activity
    await ActivityLog.create({
      adminId: req.admin._id,
      action: "send_broadcast",
      entityType: "notification",
      before: null,
      after: { title, message: messageBody, targetCount: notifications.length },
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({
      message: "Broadcast sent successfully",
      recipientCount: notifications.length,
    });
  } catch (err) {
    console.error("Send broadcast error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// NOTIFICATION LOGS
// ============================================================
export const getNotificationLogs = async (req, res) => {
  try {
    const { type, ownerId, page = 1, limit = 50 } = req.query;
    
    const query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (ownerId) {
      query.ownerId = ownerId;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate("ownerId", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query),
    ]);
    
    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("Get notification logs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

