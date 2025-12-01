// backend/controllers/bookingController.js
import Booking from "../models/Booking.js";
import Field from "../models/Field.js";

/**
 * POST /api/bookings
 * إنشاء حجز جديد
 */
export const createBooking = async (req, res) => {
  try {
    const {
      fieldId,
      customerName,
      customerPhone,
      customerEmail,
      date,
      time,
      durationHours,
    } = req.body;

    const field = await Field.findById(fieldId);
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    const hours = durationHours || 1;
    const totalPrice = field.pricePerHour * hours;

    const booking = await Booking.create({
      field: fieldId,
      customerName,
      customerPhone,
      customerEmail,
      date,
      time,
      durationHours: hours,
      totalPrice,
    });

    res.status(201).json({ message: "Booking created", booking });
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/bookings/field/:fieldId?date=YYYY-MM-DD
 * حجوزات ملعب معيّن في يوم معيّن
 */
export const getFieldBookingsForDay = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { date } = req.query;

    const query = { field: fieldId };
    if (date) query.date = date;

    const bookings = await Booking.find(query).sort({ time: 1 });

    res.json({ bookings });
  } catch (err) {
    console.error("Get bookings error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
