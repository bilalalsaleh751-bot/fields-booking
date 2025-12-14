// backend/controllers/availabilityController.js
import Booking from "../models/Booking.js";
import Field from "../models/Field.js";
import {
  timeToMinutes,
  timeRangesOverlap,
  getBookingRange,
  generateHourlySlots,
  SLOT_DURATION_MINUTES,
  BLOCKED_SLOT_DURATION_MINUTES,
} from "../utils/timeUtils.js";

// ============================================================
// GET FIELD AVAILABILITY
// Returns slot availability with STRICT RANGE-BASED overlap detection
// Uses centralized time utilities for consistency
// ============================================================
export const getFieldAvailability = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { date } = req.query; // YYYY-MM-DD

    // Validate date parameter
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    // Load field
    const field = await Field.findById(fieldId);
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    // Parse opening hours
    let openHour, closeHour;
    if (typeof field.openHour === "number" && typeof field.closeHour === "number") {
      openHour = field.openHour;
      closeHour = field.closeHour;
    } else {
      const openStr = field.openingHours?.open || "08:00";
      const closeStr = field.openingHours?.close || "23:00";
      openHour = parseInt(openStr.split(":")[0], 10);
      closeHour = parseInt(closeStr.split(":")[0], 10);
    }
    if (Number.isNaN(openHour) || Number.isNaN(closeHour)) {
      openHour = 8;
      closeHour = 23;
    }

    // Generate all possible hourly slots (60-min granularity)
    const allSlots = generateHourlySlots(openHour, closeHour);

    // Check if entire date is blocked
    const isDateBlocked = (field.blockedDates || []).includes(date);

    // Get blocked time slots for this date
    const blockedEntry = (field.blockedTimeSlots || []).find(
      (entry) => entry.date === date
    );
    const blockedTimeSlots = blockedEntry?.timeSlots || [];

    // Load all non-cancelled bookings for this day
    const bookings = await Booking.find({ 
      field: fieldId, 
      date,
      status: { $ne: "cancelled" }
    });

    // Build list of occupied time ranges from bookings
    // Uses explicit endTime if available, otherwise calculates from duration
    const bookedRanges = bookings
      .filter(b => b.startTime)
      .map(booking => {
        // Prefer explicit endTime for accuracy
        if (booking.endTime) {
          return {
            start: timeToMinutes(booking.startTime),
            end: timeToMinutes(booking.endTime)
          };
        }
        // Fallback to calculation from duration
        return getBookingRange(booking.startTime, booking.duration);
      });

    // Build list of blocked time ranges (30-min each for owner flexibility)
    const blockedRanges = blockedTimeSlots.map(blockedTime => {
      const startMin = timeToMinutes(blockedTime);
      return { start: startMin, end: startMin + BLOCKED_SLOT_DURATION_MINUTES };
    });

    // Process each slot with RANGE-BASED overlap detection
    const slots = allSlots.map((time) => {
      const slotStart = timeToMinutes(time);
      const slotEnd = slotStart + SLOT_DURATION_MINUTES;

      // Check if this slot's range overlaps with any booked range
      const isBooked = bookedRanges.some(range => 
        timeRangesOverlap(slotStart, slotEnd, range.start, range.end)
      );

      // Check if this slot's range overlaps with any blocked range
      let isBlocked = isDateBlocked;
      if (!isBlocked) {
        isBlocked = blockedRanges.some(range =>
          timeRangesOverlap(slotStart, slotEnd, range.start, range.end)
        );
      }

      return {
        time,
        isBooked,
        isBlocked,
        isAvailable: !isBooked && !isBlocked,
      };
    });

    // Check if day is fully booked/blocked
    const fullDay = slots.length > 0 && slots.every(s => !s.isAvailable);

    res.json({
      fieldId,
      date,
      openHour,
      closeHour,
      slots,
      fullDay,
    });

  } catch (err) {
    console.error("Availability error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   UPDATE FIELD AVAILABILITY (PDR 2.3 Phase 2 - Authorization)
   Note: authorizeFieldOwner middleware ensures req.field is set
========================================================= */
export const updateFieldAvailability = async (req, res) => {
  try {
    // Field is already verified and attached by authorizeFieldOwner middleware
    const field = req.field;

    const { openingHours } = req.body;

    if (openingHours) {
      if (openingHours.open) field.openingHours.open = openingHours.open;
      if (openingHours.close) field.openingHours.close = openingHours.close;
    }

    await field.save();

    res.json({
      message: "Field availability updated successfully",
      field: {
        _id: field._id,
        name: field.name,
        openingHours: field.openingHours,
      },
    });
  } catch (err) {
    console.error("Update Availability Error:", err);
    res.status(500).json({
      message: "Server error while updating availability",
    });
  }
};
