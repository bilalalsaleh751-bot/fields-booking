// backend/controllers/notificationController.js
import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import Owner from "../models/Owner.js";

// ===============================
// GET OWNER NOTIFICATIONS
// ===============================
export const getOwnerNotifications = async (req, res) => {
  try {
    const { ownerId, limit = 20, unreadOnly } = req.query;

    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: "Valid ownerId is required" });
    }

    const query = { owner: ownerId };
    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    const unreadCount = await Notification.countDocuments({
      owner: ownerId,
      isRead: false,
    });

    res.json({
      notifications,
      unreadCount,
      total: notifications.length,
    });
  } catch (err) {
    console.error("Get Notifications Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// MARK NOTIFICATION AS READ
// ===============================
export const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { ownerId } = req.body;

    if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: "Valid notification ID required" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, owner: ownerId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read", notification });
  } catch (err) {
    console.error("Mark Read Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// MARK ALL NOTIFICATIONS AS READ
// ===============================
export const markAllNotificationsRead = async (req, res) => {
  try {
    const { ownerId } = req.body;

    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: "Valid ownerId is required" });
    }

    await Notification.updateMany(
      { owner: ownerId, isRead: false },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Mark All Read Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// CREATE NOTIFICATION (Internal helper)
// ===============================
export const createNotification = async (ownerId, type, message, relatedBooking = null, relatedField = null) => {
  try {
    // Check if owner has this notification type enabled
    const owner = await Owner.findById(ownerId).select("notifications");
    if (!owner) return null;

    const notificationSettings = owner.notifications || {};
    
    // Check notification preference
    let shouldNotify = true;
    switch (type) {
      case "completed":
        shouldNotify = notificationSettings.bookingCompleted !== false;
        break;
      case "cancelled":
        shouldNotify = notificationSettings.bookingCancelled !== false;
        break;
      case "review":
        shouldNotify = notificationSettings.newReview !== false;
        break;
    }

    if (!shouldNotify) return null;

    // Create notification
    const notification = await Notification.create({
      owner: ownerId,
      type,
      message,
      relatedBooking,
      relatedField,
    });

    return notification;
  } catch (err) {
    console.error("Create Notification Error:", err);
    return null;
  }
};

