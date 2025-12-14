import Booking from "../models/Booking.js";
import Field from "../models/Field.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";

// ============================================================
// HELPER: Create activity log
// ============================================================
const logActivity = async (adminId, action, entityType, entityId, before, after, req) => {
  try {
    await ActivityLog.create({
      adminId,
      action,
      entityType,
      entityId,
      before,
      after,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers["user-agent"],
    });
  } catch (err) {
    console.error("Failed to create activity log:", err);
  }
};

// ============================================================
// LIST ALL BOOKINGS
// ============================================================
export const listBookings = async (req, res) => {
  try {
    const { status, fieldId, date, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (fieldId) {
      query.field = fieldId;
    }
    
    if (date) {
      query.date = date;
    }
    
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate({
          path: "field",
          select: "name city owner",
          populate: { path: "owner", select: "fullName email" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(query),
    ]);
    
    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("List bookings error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// GET SINGLE BOOKING
// ============================================================
export const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: "field",
        populate: { path: "owner", select: "fullName email phone" },
      });
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.json({ booking });
  } catch (err) {
    console.error("Get booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// UPDATE BOOKING STATUS
// ============================================================
export const updateBookingStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    const validStatuses = ["pending", "confirmed", "completed", "cancelled", "disputed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const booking = await Booking.findById(req.params.id).populate("field");
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    const before = { status: booking.status, paymentStatus: booking.paymentStatus };
    
    booking.status = status;
    
    // Handle payment status changes
    if (status === "cancelled") {
      booking.paymentStatus = "refunded";
    } else if (status === "confirmed" || status === "completed") {
      booking.paymentStatus = "paid";
    }
    
    // Handle dispute
    if (status === "disputed") {
      booking.disputeReason = reason;
    }
    
    await booking.save();
    
    // Log activity
    await logActivity(
      req.admin._id,
      "update_booking",
      "booking",
      booking._id,
      before,
      { status: booking.status, paymentStatus: booking.paymentStatus },
      req
    );
    
    // Notify owner
    if (booking.field?.owner) {
      try {
        await Notification.create({
          owner: booking.field.owner,
          type: "booking_status_changed",
          message: `Booking for "${booking.field.name}" status changed to ${status}${reason ? `. Reason: ${reason}` : ""}`,
          relatedBooking: booking._id,
          relatedField: booking.field._id,
        });
      } catch (notifErr) {
        console.error("Failed to create notification:", notifErr);
      }
    }
    
    // Re-populate for complete response data
    await booking.populate({
      path: "field",
      select: "name city owner",
      populate: { path: "owner", select: "fullName email" },
    });
    
    res.json({ message: "Booking updated", booking });
  } catch (err) {
    console.error("Update booking status error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// HANDLE DISPUTE
// ============================================================
export const handleDispute = async (req, res) => {
  try {
    const { resolution, newStatus } = req.body;
    
    if (!resolution) {
      return res.status(400).json({ message: "Resolution is required" });
    }
    
    const booking = await Booking.findById(req.params.id).populate("field");
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    if (booking.status !== "disputed") {
      return res.status(400).json({ message: "Booking is not in disputed status" });
    }
    
    const before = { status: booking.status, disputeResolution: booking.disputeResolution };
    
    booking.disputeResolution = resolution;
    booking.disputeResolvedAt = new Date();
    booking.status = newStatus || "cancelled"; // Default to cancelled
    
    if (newStatus === "cancelled") {
      booking.paymentStatus = "refunded";
    }
    
    await booking.save();
    
    // Log activity
    await logActivity(
      req.admin._id,
      "resolve_dispute",
      "booking",
      booking._id,
      before,
      { status: booking.status, resolution },
      req
    );
    
    // Notify owner
    if (booking.field?.owner) {
      try {
        await Notification.create({
          owner: booking.field.owner,
          type: "dispute_resolved",
          message: `Dispute for booking at "${booking.field.name}" has been resolved. Resolution: ${resolution}`,
          relatedBooking: booking._id,
          relatedField: booking.field._id,
        });
      } catch (notifErr) {
        console.error("Failed to create notification:", notifErr);
      }
    }
    
    // Re-populate for complete response data
    await booking.populate({
      path: "field",
      select: "name city owner",
      populate: { path: "owner", select: "fullName email" },
    });
    
    res.json({ message: "Dispute resolved", booking });
  } catch (err) {
    console.error("Handle dispute error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

