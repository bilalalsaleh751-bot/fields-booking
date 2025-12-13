// backend/controllers/ownerBookingController.js
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Field from "../models/Field.js";

// Helper: Convert date + time → Date object
function buildDateObject(dateStr, timeStr) {
  try {
    return new Date(`${dateStr}T${timeStr}:00`);
  } catch {
    return null;
  }
}

// Helper: Format date for display
const formatDate = (dateStr) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// Helper: Format time range
const formatTimeRange = (startTime, duration) => {
  try {
    const [startH, startM] = startTime.split(":").map(Number);
    const endH = startH + Math.ceil(duration || 1);
    const start12 = startH > 12 ? `${startH - 12}:${String(startM).padStart(2, "0")} PM` : 
                   startH === 12 ? `12:${String(startM).padStart(2, "0")} PM` :
                   startH === 0 ? `12:${String(startM).padStart(2, "0")} AM` :
                   `${startH}:${String(startM).padStart(2, "0")} AM`;
    const end12 = endH > 12 ? `${endH - 12}:${String(startM).padStart(2, "0")} PM` :
                  endH === 12 ? `12:${String(startM).padStart(2, "0")} PM` :
                  endH === 0 ? `12:${String(startM).padStart(2, "0")} AM` :
                  `${endH}:${String(startM).padStart(2, "0")} AM`;
    return `${start12} - ${end12}`;
  } catch {
    return startTime;
  }
};

// =================================================
// GET ALL BOOKINGS FOR OWNER (PDR 2.4)
// =================================================
export const getOwnerBookings = async (req, res) => {
  try {
    const { ownerId, status, dateFrom, dateTo } = req.query;

    if (!ownerId) {
      return res.status(400).json({ message: "ownerId is required" });
    }

    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    // Find all fields owned by this owner
    const fields = await Field.find({ owner: ownerObjectId });
    const fieldIds = fields.map((f) => f._id);

    if (fieldIds.length === 0) {
      return res.json({
        bookings: [],
        count: 0,
      });
    }

    // Build query
    const query = { field: { $in: fieldIds } };

    if (status) {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = dateFrom;
      if (dateTo) query.date.$lte = dateTo;
    }

    // Fetch bookings with field info
    const bookings = await Booking.find(query)
      .populate("field", "name sportType city")
      .sort({ date: -1, startTime: -1 })
      .lean();

    // Format bookings
    const formattedBookings = bookings.map((b) => ({
      _id: b._id,
      bookingCode: b._id.toString().slice(-6).toUpperCase(),
      fieldId: b.field._id,
      fieldName: b.field.name,
      fieldSport: b.field.sportType || b.field.sport,
      customerName: b.userName,
      customerEmail: b.userEmail,
      customerPhone: b.userPhone,
      date: b.date,
      dateFormatted: formatDate(b.date),
      startTime: b.startTime,
      timeRange: formatTimeRange(b.startTime, b.duration),
      duration: b.duration,
      totalPrice: b.totalPrice,
      status: b.status,
      paymentStatus: b.status === "confirmed" ? "paid" : b.status === "cancelled" ? "refunded" : "pending",
      createdAt: b.createdAt,
    }));

    res.json({
      bookings: formattedBookings,
      count: formattedBookings.length,
    });
  } catch (err) {
    console.error("Get Owner Bookings Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =================================================
// GET BOOKING BY ID (PDR 2.4)
// =================================================
export const getOwnerBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { ownerId } = req.query;

    if (!ownerId) {
      return res.status(400).json({ message: "ownerId is required" });
    }

    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    // Find booking and verify ownership
    const booking = await Booking.findById(bookingId)
      .populate("field", "name sportType city owner")
      .lean();

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify owner owns the field
    if (booking.field.owner.toString() !== ownerObjectId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Format booking
    const formattedBooking = {
      _id: booking._id,
      bookingCode: booking._id.toString().slice(-6).toUpperCase(),
      fieldId: booking.field._id,
      fieldName: booking.field.name,
      fieldSport: booking.field.sportType || booking.field.sport,
      customerName: booking.userName,
      customerEmail: booking.userEmail,
      customerPhone: booking.userPhone,
      date: booking.date,
      dateFormatted: formatDate(booking.date),
      startTime: booking.startTime,
      timeRange: formatTimeRange(booking.startTime, booking.duration),
      duration: booking.duration,
      totalPrice: booking.totalPrice,
      status: booking.status,
      paymentStatus: booking.status === "confirmed" ? "paid" : booking.status === "cancelled" ? "refunded" : "pending",
      createdAt: booking.createdAt,
    };

    res.json(formattedBooking);
  } catch (err) {
    console.error("Get Booking Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =================================================
// UPDATE BOOKING STATUS (PDR 2.4)
// Mark as completed or cancel
// =================================================
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { ownerId, status } = req.body;

    if (!ownerId || !status) {
      return res.status(400).json({ message: "ownerId and status are required" });
    }

    if (!["confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'confirmed' or 'cancelled'" });
    }

    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    // Find booking and verify ownership
    const booking = await Booking.findById(bookingId).populate("field", "owner");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify owner owns the field
    if (booking.field.owner.toString() !== ownerObjectId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update status
    booking.status = status;
    await booking.save();

    res.json({
      message: `Booking ${status === "cancelled" ? "cancelled" : "marked as completed"} successfully`,
      booking: {
        _id: booking._id,
        status: booking.status,
        paymentStatus: booking.status === "confirmed" ? "paid" : booking.status === "cancelled" ? "refunded" : "pending",
      },
    });
  } catch (err) {
    console.error("Update Booking Status Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

