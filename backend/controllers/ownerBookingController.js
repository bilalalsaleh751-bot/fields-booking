// backend/controllers/ownerBookingController.js
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Field from "../models/Field.js";
import Transaction from "../models/Transaction.js";
import PlatformSettings from "../models/PlatformSettings.js";
import { createNotification } from "./notificationController.js";

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

// Helper: Format time to 12-hour format
const formatTime12h = (timeStr) => {
  if (!timeStr) return "";
  const [h, m = "00"] = timeStr.split(":").map(Number);
  if (h > 12) return `${h - 12}:${String(m).padStart(2, "0")} PM`;
  if (h === 12) return `12:${String(m).padStart(2, "0")} PM`;
  if (h === 0) return `12:${String(m).padStart(2, "0")} AM`;
  return `${h}:${String(m).padStart(2, "0")} AM`;
};

// Helper: Format time range using explicit start and end times
const formatTimeRange = (startTime, endTime, duration) => {
  try {
    // Use explicit endTime if available, otherwise calculate from duration
    let actualEndTime = endTime;
    if (!actualEndTime && startTime && duration) {
      const [startH] = startTime.split(":").map(Number);
      const endH = startH + Math.ceil(duration);
      actualEndTime = `${String(endH).padStart(2, "0")}:00`;
    }
    return `${formatTime12h(startTime)} → ${formatTime12h(actualEndTime)}`;
  } catch {
    return startTime;
  }
};

// Helper: Categorize booking as upcoming, past, or cancelled
const categorizeBooking = (booking) => {
  try {
    if (booking.status === "cancelled") return "cancelled";
    if (booking.status === "completed") return "past";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const bookingDate = new Date(booking.date);
    if (isNaN(bookingDate.getTime())) {
      return "past"; // Invalid date, treat as past
    }
    
    bookingDate.setHours(0, 0, 0, 0);
    
    if (bookingDate >= today) return "upcoming";
    return "past";
  } catch (err) {
    console.error("categorizeBooking error:", err);
    return "past";
  }
};

// Helper: Check if booking end time has passed
const isBookingEnded = (booking) => {
  try {
    const now = new Date();
    
    // Get end time - fallback to calculating from startTime + duration
    let endTime = booking.endTime;
    if (!endTime && booking.startTime && booking.duration) {
      const [startH] = booking.startTime.split(":").map(Number);
      const endH = startH + Math.ceil(booking.duration);
      endTime = `${String(endH).padStart(2, "0")}:00`;
    }
    
    // If still no endTime, use startTime as fallback
    if (!endTime) {
      endTime = booking.startTime || "23:00";
    }
    
    const [endH, endM = "0"] = endTime.split(":").map(Number);
    
    // Parse date string properly to avoid timezone issues
    // booking.date is "YYYY-MM-DD" format
    const dateStr = booking.date;
    if (!dateStr) {
      // No date, assume booking has ended
      return true;
    }
    
    // Parse date parts manually to ensure local timezone
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) {
      // Invalid date format, assume booking has ended
      return true;
    }
    
    // Create date in LOCAL timezone (month is 0-indexed)
    const bookingEndDateTime = new Date(year, month - 1, day, endH || 0, endM || 0, 0, 0);
    
    if (isNaN(bookingEndDateTime.getTime())) {
      // Invalid date, assume booking has ended
      return true;
    }
    
    return now >= bookingEndDateTime;
  } catch (err) {
    console.error("isBookingEnded error:", err);
    // On error, default to allowing completion
    return true;
  }
};

// Helper: Check if booking can be acted upon
const canModifyBooking = (booking) => {
  // Cannot modify completed or cancelled bookings
  return !["completed", "cancelled"].includes(booking.status);
};

// ============================================================
// BOOKING ACTION VISIBILITY RULES (PDR 2.4 Compliant)
// Strict enforcement of which actions are allowed per state
// ============================================================

/**
 * Determine allowed actions for a booking based on its state and time
 * 
 * RULES:
 * 1. Upcoming (pending/confirmed, date >= today):
 *    - Cancel: Always allowed
 *    - Complete: Only if current time > booking endTime
 * 
 * 2. Past (completed OR date < today):
 *    - View only, no actions
 * 
 * 3. Cancelled:
 *    - View only, no actions
 */
const getBookingActions = (booking) => {
  // Default: no actions allowed
  const actions = {
    canCancel: false,
    canComplete: false,
  };

  // Rule: Cancelled bookings → no actions
  if (booking.status === "cancelled") {
    return actions;
  }

  // Rule: Completed bookings → no actions
  if (booking.status === "completed") {
    return actions;
  }

  // Active bookings (pending or confirmed)
  // These are the only ones that can have actions

  // Rule: Can always cancel an active booking
  actions.canCancel = true;

  // Rule: Can only complete AFTER booking end time
  actions.canComplete = isBookingEnded(booking);

  return actions;
};

// Helper: Get payment status based on booking status
const getPaymentStatus = (status) => {
  switch (status) {
    case "confirmed":
    case "completed":
      return "paid";
    case "cancelled":
      return "refunded";
    default:
      return "pending";
  }
};

// Helper: Calculate end time from start time and duration
const calculateEndTime = (startTime, duration) => {
  if (!startTime) return null;
  
  try {
    const [startH, startM = "0"] = startTime.split(":").map(Number);
    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const durationMinutes = (Number(duration) || 1) * 60;
    const endMinutes = startMinutes + durationMinutes;
    
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  } catch (err) {
    console.error("calculateEndTime error:", err);
    return null;
  }
};

// Helper: Ensure booking has endTime, calculate and save if missing
const ensureEndTime = async (booking) => {
  if (booking.endTime) return booking.endTime;
  
  // Calculate endTime from startTime + duration
  const calculatedEndTime = calculateEndTime(booking.startTime, booking.duration);
  
  if (calculatedEndTime) {
    booking.endTime = calculatedEndTime;
    await booking.save();
    console.log(`Fixed missing endTime for booking ${booking._id}: ${calculatedEndTime}`);
  }
  
  return calculatedEndTime;
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

    // Validate ownerId format
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: "Invalid owner ID format" });
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

    // Format bookings with category and explicit time range
    const formattedBookings = bookings
      .filter((b) => b && b.field) // Filter out any invalid bookings
      .map((b) => {
        try {
          // Ensure endTime is available (calculate if missing)
          const endTime = b.endTime || calculateEndTime(b.startTime, b.duration);
          
          return {
            _id: b._id,
            bookingCode: b._id.toString().slice(-6).toUpperCase(),
            fieldId: b.field._id,
            fieldName: b.field.name || "Unknown Field",
            fieldSport: b.field.sportType || b.field.sport || "Sport",
            customerName: b.userName || "Unknown",
            customerEmail: b.userEmail || "",
            customerPhone: b.userPhone || "",
            date: b.date,
            dateFormatted: formatDate(b.date),
            startTime: b.startTime,
            endTime: endTime, // Always provide endTime (calculated if missing)
            timeRange: formatTimeRange(b.startTime, endTime, b.duration),
            duration: b.duration || 1,
            totalPrice: b.totalPrice || 0,
            status: b.status || "pending",
            category: categorizeBooking(b), // upcoming, past, or cancelled
            paymentStatus: getPaymentStatus(b.status),
            ...getBookingActions(b), // PDR-compliant action flags
            createdAt: b.createdAt,
          };
        } catch (err) {
          console.error("Error formatting booking:", b._id, err);
          return null;
        }
      })
      .filter(Boolean); // Remove any null entries from formatting errors

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

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: "Invalid owner ID format" });
    }
    
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid booking ID format" });
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

    // Ensure endTime is available (calculate if missing)
    const endTime = booking.endTime || calculateEndTime(booking.startTime, booking.duration);

    // Format booking with explicit time range
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
      endTime: endTime, // Always provide endTime (calculated if missing)
      timeRange: formatTimeRange(booking.startTime, endTime, booking.duration),
      duration: booking.duration,
      totalPrice: booking.totalPrice,
      status: booking.status,
      category: categorizeBooking(booking), // upcoming, past, or cancelled
      paymentStatus: getPaymentStatus(booking.status),
      ...getBookingActions(booking), // PDR-compliant action flags
      createdAt: booking.createdAt,
    };

    res.json(formattedBooking);
  } catch (err) {
    console.error("Get Booking Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =================================================
// UPDATE BOOKING STATUS (PDR 2.4 Step 2)
// Actions: Complete or Cancel booking
// =================================================
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { ownerId, action } = req.body;

    // Validate required fields
    if (!ownerId) {
      return res.status(400).json({ message: "ownerId is required" });
    }
    
    if (!action) {
      return res.status(400).json({ message: "action is required" });
    }

    if (!["complete", "cancel", "confirm"].includes(action)) {
      return res.status(400).json({ message: "Action must be 'complete', 'cancel', or 'confirm'" });
    }

    // Validate bookingId format
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    // Validate ownerId format
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: "Invalid owner ID" });
    }

    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    // Find booking and verify ownership
    const booking = await Booking.findById(bookingId).populate("field", "owner name");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if field exists (in case of data inconsistency)
    if (!booking.field) {
      return res.status(404).json({ message: "Associated field not found" });
    }

    // Verify owner owns the field
    if (!booking.field.owner || booking.field.owner.toString() !== ownerObjectId.toString()) {
      return res.status(403).json({ message: "Unauthorized: You do not own this field" });
    }

    // ============================================================
    // CRITICAL: Ensure endTime is populated before any operations
    // This fixes bookings created before endTime was mandatory
    // ============================================================
    await ensureEndTime(booking);

    // Check if booking can be modified
    if (!canModifyBooking(booking)) {
      return res.status(409).json({ 
        message: `Cannot modify a ${booking.status} booking` 
      });
    }

    // Handle COMPLETE action
    if (action === "complete") {
      // Validate: Can only complete CONFIRMED or PENDING bookings
      if (booking.status !== "confirmed" && booking.status !== "pending") {
        return res.status(400).json({ 
          message: "Only confirmed or pending bookings can be marked as completed" 
        });
      }
      
      // Validate: Can only complete after booking end time
      if (!isBookingEnded(booking)) {
        return res.status(400).json({ 
          message: "Cannot mark as completed before booking end time" 
        });
      }
      
      booking.status = "completed";
      booking.paymentStatus = "paid";
      await booking.save();

      // Create transaction (idempotent - won't duplicate)
      const existingTransaction = await Transaction.findOne({ bookingId: booking._id });
      if (!existingTransaction) {
        const settings = await PlatformSettings.getSettings();
        const commissionRate = settings.commissionRate || 15;
        const commissionAmount = (booking.totalPrice * commissionRate) / 100;
        const netToOwner = booking.totalPrice - commissionAmount;
        
        await Transaction.create({
          bookingId: booking._id,
          fieldId: booking.field._id,
          ownerId: booking.field.owner,
          userName: booking.userName,
          userEmail: booking.userEmail,
          userPhone: booking.userPhone,
          amountGross: booking.totalPrice,
          commissionRate,
          commissionAmount,
          netToOwner,
          status: "completed",
          bookingDate: booking.date,
          bookingStartTime: booking.startTime,
          bookingEndTime: booking.endTime,
          fieldName: booking.field.name,
        });
      }

      // Trigger notification for booking completion
      const fieldName = booking.field?.name || "Field";
      await createNotification(
        booking.field.owner,
        "completed",
        `Booking completed: ${booking.userName} at ${fieldName} on ${booking.date}`,
        booking._id,
        booking.field._id
      );

      return res.json({
        message: "Booking marked as completed successfully",
        booking: {
          _id: booking._id,
          status: booking.status,
          paymentStatus: getPaymentStatus(booking.status),
          category: categorizeBooking(booking),
        },
      });
    }

    // Handle CONFIRM action (for pending bookings)
    if (action === "confirm") {
      if (booking.status !== "pending") {
        return res.status(400).json({ 
          message: "Only pending bookings can be confirmed" 
        });
      }
      
      booking.status = "confirmed";
      await booking.save();

      return res.json({
        message: "Booking confirmed successfully",
        booking: {
          _id: booking._id,
          status: booking.status,
          paymentStatus: getPaymentStatus(booking.status),
          category: categorizeBooking(booking),
        },
      });
    }

    // Handle CANCEL action
    if (action === "cancel") {
      // Cancel the booking (this frees the time slot for availability)
      booking.status = "cancelled";
      await booking.save();

      // Trigger notification for booking cancellation
      const fieldName = booking.field?.name || "Field";
      await createNotification(
        booking.field.owner,
        "cancelled",
        `Booking cancelled: ${booking.userName} at ${fieldName} on ${booking.date}`,
        booking._id,
        booking.field._id
      );

      return res.json({
        message: "Booking cancelled successfully. Time slot is now available.",
        booking: {
          _id: booking._id,
          status: booking.status,
          paymentStatus: getPaymentStatus(booking.status), // Returns "refunded"
          category: categorizeBooking(booking),
        },
      });
    }

    // Fallback (should not reach here)
    return res.status(400).json({ message: "Invalid action" });

  } catch (err) {
    console.error("Update Booking Status Error:", err);
    
    // Handle specific MongoDB errors
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: "Server error while updating booking status" });
  }
};

