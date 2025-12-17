// backend/controllers/ownerSettingsController.js
// PDR Owner Settings - Profile, Business, Notifications
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Owner from "../models/Owner.js";
import Booking from "../models/Booking.js";
import Field from "../models/Field.js";
import PlatformSettings from "../models/PlatformSettings.js";

// ===============================
// GET OWNER SETTINGS
// ===============================
export const getOwnerSettings = async (req, res) => {
  try {
    const { ownerId } = req.query;

    if (!ownerId) {
      return res.status(400).json({ message: "ownerId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: "Invalid owner ID format" });
    }

    const owner = await Owner.findById(ownerId).select("-password");

    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    // Get owner's fields for earnings calculation
    const fields = await Field.find({ owner: ownerId });
    const fieldIds = fields.map((f) => f._id);

    // Calculate total earnings from CONFIRMED and COMPLETED bookings
    let totalEarnings = 0;
    if (fieldIds.length > 0) {
      const earningsBookings = await Booking.find({
        field: { $in: fieldIds },
        status: { $in: ["confirmed", "completed"] }, // Both confirmed and completed count
      });
      totalEarnings = earningsBookings.reduce(
        (sum, b) => sum + (b.totalPrice || 0),
        0
      );
    }

    // FETCH COMMISSION RATE FROM PLATFORM SETTINGS (SINGLE SOURCE OF TRUTH)
    const settings = await PlatformSettings.getSettings();
    const commissionRatePercent = settings.commissionRate || 15; // Stored as percentage (e.g., 15)
    const commissionRate = commissionRatePercent / 100; // Convert to decimal (e.g., 0.15)
    const platformCommission = totalEarnings * commissionRate;
    const netEarnings = totalEarnings - platformCommission;

    res.json({
      profile: {
        fullName: owner.fullName,
        email: owner.email,
        phone: owner.phone,
      },
      business: {
        businessName: owner.businessName || "",
        city: owner.city || "",
        area: owner.area || "",
        businessDescription: owner.businessDescription || "",
      },
      payout: {
        commissionRate,
        commissionPercentage: commissionRate * 100,
        totalEarnings,
        platformCommission,
        netEarnings,
        payoutMethod: "Bank Transfer (Coming Soon)",
      },
      notifications: owner.notifications || {
        bookingCompleted: true,
        bookingCancelled: true,
        newReview: true,
      },
    });
  } catch (err) {
    console.error("Get Owner Settings Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// UPDATE PROFILE INFO
// ===============================
export const updateOwnerProfile = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { fullName, phone } = req.body;

    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: "Invalid owner ID" });
    }

    // Build update object with only provided fields
    const updateFields = {};
    if (fullName) updateFields.fullName = fullName;
    if (phone) updateFields.phone = phone;

    // Use findByIdAndUpdate to avoid full document validation
    const owner = await Owner.findByIdAndUpdate(
      ownerId,
      { $set: updateFields },
      { new: true, runValidators: false }
    ).select("-password");

    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    res.json({
      message: "Profile updated successfully",
      profile: {
        fullName: owner.fullName,
        email: owner.email,
        phone: owner.phone,
      },
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ message: err.message || "Server error updating profile" });
  }
};

// ===============================
// CHANGE PASSWORD
// ===============================
export const changeOwnerPassword = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: "Invalid owner ID" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both passwords are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // First, fetch owner to verify current password
    const owner = await Owner.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, owner.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Use findByIdAndUpdate to avoid full document validation
    await Owner.findByIdAndUpdate(
      ownerId,
      { $set: { password: hashedPassword } },
      { runValidators: false }
    );

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ message: err.message || "Server error changing password" });
  }
};

// ===============================
// UPDATE BUSINESS INFO
// ===============================
export const updateOwnerBusiness = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { businessName, city, area, businessDescription } = req.body;

    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: "Invalid owner ID" });
    }

    // Build update object with only provided fields
    const updateFields = {};
    if (businessName !== undefined) updateFields.businessName = businessName;
    if (city !== undefined) updateFields.city = city;
    if (area !== undefined) updateFields.area = area;
    if (businessDescription !== undefined) updateFields.businessDescription = businessDescription;

    // Use findByIdAndUpdate to avoid full document validation
    const owner = await Owner.findByIdAndUpdate(
      ownerId,
      { $set: updateFields },
      { new: true, runValidators: false }
    ).select("-password");

    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    res.json({
      message: "Business info updated successfully",
      business: {
        businessName: owner.businessName,
        city: owner.city,
        area: owner.area,
        businessDescription: owner.businessDescription,
      },
    });
  } catch (err) {
    console.error("Update Business Error:", err);
    res.status(500).json({ message: err.message || "Server error updating business info" });
  }
};

// ===============================
// UPDATE NOTIFICATION PREFERENCES
// ===============================
export const updateOwnerNotifications = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { bookingCompleted, bookingCancelled, newReview } = req.body;

    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: "Invalid owner ID" });
    }

    // Build update object for notifications
    const updateFields = {};
    if (bookingCompleted !== undefined) {
      updateFields["notifications.bookingCompleted"] = bookingCompleted;
    }
    if (bookingCancelled !== undefined) {
      updateFields["notifications.bookingCancelled"] = bookingCancelled;
    }
    if (newReview !== undefined) {
      updateFields["notifications.newReview"] = newReview;
    }

    // Use findByIdAndUpdate to avoid full document validation
    const owner = await Owner.findByIdAndUpdate(
      ownerId,
      { $set: updateFields },
      { new: true, runValidators: false }
    ).select("-password");

    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    res.json({
      message: "Notification preferences updated successfully",
      notifications: owner.notifications || {
        bookingCompleted: true,
        bookingCancelled: true,
        newReview: true,
      },
    });
  } catch (err) {
    console.error("Update Notifications Error:", err);
    res.status(500).json({ message: err.message || "Server error updating notifications" });
  }
};

