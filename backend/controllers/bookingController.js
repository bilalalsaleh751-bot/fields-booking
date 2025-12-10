// backend/controllers/bookingController.js
import Booking from "../models/Booking.js";
import Field from "../models/Field.js";

// -------------------------------------------------------------
// 1) CREATE BOOKING (with full overlap protection)
// -------------------------------------------------------------
export const createBooking = async (req, res) => {
  try {
    const {
      fieldId,
      userName,
      userEmail,
      userPhone,
      date,
      startTime,
      duration,
    } = req.body;

    if (
      !fieldId ||
      !userName ||
      !userEmail ||
      !userPhone ||
      !date ||
      !startTime ||
      !duration
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Fetch field info
    const field = await Field.findById(fieldId);
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    const totalPrice = (field.pricePerHour || 0) * Number(duration);

    // ------------------------------------------------------------
    // 🛑 Prevent overlap based on duration
    // Example: 6 PM, duration 3 → requires: 18:00, 19:00, 20:00
    // ------------------------------------------------------------

    const startHour = parseInt(startTime.split(":")[0], 10);

    // Round up: 1.5 → 2, 2.25 → 3
    const requiredHours = Math.ceil(Number(duration));

    // Build array of required slot times
    const requiredSlots = Array.from({ length: requiredHours }, (_, i) => {
      const h = startHour + i;
      return `${String(h).padStart(2, "0")}:00`;
    });

    // Check database for conflicts
    const conflicts = await Booking.find({
      field: fieldId,
      date,
      startTime: { $in: requiredSlots },
    });

    if (conflicts.length > 0) {
      return res.status(409).json({
        message: "Selected time range overlaps with an existing booking",
      });
    }

    // Create booking
    const booking = await Booking.create({
      field: fieldId,
      userName,
      userEmail,
      userPhone,
      date,
      startTime,
      duration,
      totalPrice,
    });

    return res.status(201).json({
      message: "Booking created successfully",
      bookingId: booking._id,
    });
  } catch (err) {
    console.error("Booking error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// -------------------------------------------------------------
// 2) GET BOOKING BY ID
// -------------------------------------------------------------
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("field");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------------------------------------------------
// 3) GET BOOKINGS FOR SPECIFIC FIELD
// -------------------------------------------------------------
export const getBookingsForField = async (req, res) => {
  try {
    const bookings = await Booking.find({
      field: req.params.fieldId,
    });

    res.json(bookings);
  } catch (err) {
    console.error("Booking fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------------------------------------------------
// 4) RETURN AVAILABILITY FOR SPECIFIC DATE
// (Used by frontend step 4: Slots UI)
// -------------------------------------------------------------
export const getFieldAvailability = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { date } = req.query; // YYYY-MM-DD

    if (!date) {
      return res
        .status(400)
        .json({ message: "date query is required (YYYY-MM-DD)" });
    }

    const field = await Field.findById(fieldId);
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    // Opening hours
    const open = field.openingHours?.open || "08:00";
    const close = field.openingHours?.close || "23:00";

    const openHour = parseInt(open.split(":")[0], 10);
    const closeHour = parseInt(close.split(":")[0], 10);

    // Generate slots
    const slots = [];
    for (let h = openHour; h < closeHour; h++) {
      slots.push(`${String(h).padStart(2, "0")}:00`);
    }

    // Get bookings for this day
    const bookings = await Booking.find({
      field: fieldId,
      date,
    });

    // Mark booked slots
    const bookedSet = new Set();

    bookings.forEach((b) => {
      const start = parseInt(b.startTime.split(":")[0], 10);
      const dur = Math.ceil(Number(b.duration));

      for (let i = 0; i < dur; i++) {
        const h = start + i;
        bookedSet.add(`${String(h).padStart(2, "0")}:00`);
      }
    });

    const response = slots.map((t) => ({
      time: t,
      isBooked: bookedSet.has(t),
    }));

    // Check if FULL DAY
    const fullDay = response.every((slot) => slot.isBooked);

    res.json({
      fieldId,
      date,
      slots: response,
      fullDay,
    });
  } catch (err) {
    console.error("Availability error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
