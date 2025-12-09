// backend/controllers/availabilityController.js
import Booking from "../models/Booking.js";
import Field from "../models/Field.js";

// Helper — generate hourly time slots
const generateTimeSlots = (openHour, closeHour) => {
  const slots = [];
  for (let h = openHour; h < closeHour; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }
  return slots;
};

export const getFieldAvailability = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { date } = req.query; // YYYY-MM-DD

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    // 1️⃣ Load field
    const field = await Field.findById(fieldId);
    if (!field) return res.status(404).json({ message: "Field not found" });

    // Opening hours (support both styles)
    let openHour;
    let closeHour;

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

    // 2️⃣ Generate all possible slots
    const allSlots = generateTimeSlots(openHour, closeHour);

    // 3️⃣ Load all bookings for this day
    const bookings = await Booking.find({ field: fieldId, date });

    // 4️⃣ Mark FULLY booked slots (duration-aware)
    const bookedTimes = new Set();

    bookings.forEach((booking) => {
      if (!booking.startTime) return;

      const startHour = parseInt(booking.startTime.split(":")[0], 10);
      const duration = Number(booking.duration) || 1;

      // Prevent fractional issues (round up)
      const durRounded = Math.ceil(duration);

      // Example: 14:00 duration 2 → 14:00 + 15:00 booked
      for (let i = 0; i < durRounded; i++) {
        const h = startHour + i;
        bookedTimes.add(`${String(h).padStart(2, "0")}:00`);
      }
    });

    // 5️⃣ Map final slot list
    const slots = allSlots.map((time) => ({
      time,
      isBooked: bookedTimes.has(time),
    }));

    // 6️⃣ Return open / close hours to frontend (OPTION B needs it)
    res.json({
      fieldId,
      date,
      openHour,
      closeHour,
      slots,
    });

  } catch (err) {
    console.error("Availability error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
