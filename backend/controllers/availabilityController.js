// backend/controllers/availabilityController.js
import Booking from "../models/Booking.js";
import Field from "../models/Field.js";
import {
  timeToMinutes,
  minutesToTime,
  timeRangesOverlap,
  getBookingRange,
  generateTimeSlots,
  SLOT_DURATION_MINUTES,
  BLOCKED_SLOT_DURATION_MINUTES,
} from "../utils/timeUtils.js";

// ============================================================
// GET FIELD AVAILABILITY
// Returns slot availability with PRECISE MINUTE-LEVEL overlap detection
// Supports duration-aware availability checking
// ============================================================
export const getFieldAvailability = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { date, duration } = req.query; // YYYY-MM-DD, duration in hours (optional)

    // Validate date parameter
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    // Parse duration for duration-aware checking
    const requestedDuration = parseFloat(duration) || 1;
    const durationMinutes = requestedDuration * 60;

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

    // Handle midnight (00:00) as 24:00 for calculations
    const closingMinutes = (closeHour === 0 || closeHour < openHour) ? 24 * 60 : closeHour * 60;

    // Generate time slots with 30-minute granularity for precise booking
    const allSlots = generateTimeSlots(openHour, closeHour, 30);

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

    // Build list of occupied time ranges from bookings with EXACT times
    const bookedRanges = bookings
      .filter(b => b.startTime)
      .map(booking => {
        let start, end;
        
        // Use explicit endTime if available for maximum accuracy
        if (booking.endTime) {
          start = timeToMinutes(booking.startTime);
          end = timeToMinutes(booking.endTime);
        } else {
          // Calculate from duration
          const range = getBookingRange(booking.startTime, booking.duration || 1);
          start = range.start;
          end = range.end;
        }
        
        return {
          start,
          end,
          startTime: booking.startTime,
          endTime: booking.endTime || minutesToTime(end),
          duration: booking.duration || 1,
        };
      });

    // Build list of blocked time ranges
    const blockedRanges = blockedTimeSlots.map(blockedTime => {
      const startMin = timeToMinutes(blockedTime);
      return { start: startMin, end: startMin + BLOCKED_SLOT_DURATION_MINUTES };
    });

    // Process each slot with PRECISE RANGE-BASED overlap detection
    const slots = allSlots.map((time) => {
      const slotStart = timeToMinutes(time);
      const slotEnd = slotStart + SLOT_DURATION_MINUTES; // 30-min slot
      
      // For duration-aware check: would a booking at this time fit?
      const bookingEnd = slotStart + durationMinutes;
      
      // Check if this slot's range overlaps with any booked range
      // Use the actual booking duration, not just the slot duration
      const isBooked = bookedRanges.some(range => 
        timeRangesOverlap(slotStart, bookingEnd, range.start, range.end)
      );

      // Check if this slot's range overlaps with any blocked range
      let isBlocked = isDateBlocked;
      if (!isBlocked) {
        isBlocked = blockedRanges.some(range =>
          timeRangesOverlap(slotStart, bookingEnd, range.start, range.end)
        );
      }
      
      // Check if booking would extend past closing time
      const extendsPastClose = bookingEnd > closingMinutes;

      return {
        time,
        isBooked,
        isBlocked,
        extendsPastClose,
        isAvailable: !isBooked && !isBlocked && !extendsPastClose,
      };
    });

    // Check if day is fully booked/blocked
    const fullDay = slots.length > 0 && slots.every(s => !s.isAvailable);

    res.json({
      fieldId,
      date,
      openHour,
      closeHour,
      requestedDuration,
      slots,
      bookedRanges: bookedRanges.map(r => ({
        startTime: r.startTime,
        endTime: r.endTime,
        duration: r.duration,
      })),
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
